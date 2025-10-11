import AgoraRTC from 'agora-rtc-sdk-ng';
import axios from 'axios';

/**
 * 语音聊天工具类
 * 封装Agora RTC SDK和Agent API调用
 */
class VoiceChat {
  constructor() {
    // Agora RTC相关
    this.rtcClient = null;
    this.localAudioTrack = null;
    this.remoteAudioTrack = null;
    
    // 连接状态
    this.isConnected = false;
    this.isMuted = false;
    this.agentStarted = false;
    this.isConnecting = false;
    
    // 频道信息
    this.currentChannel = '';
    this.currentUserId = 0;
    
    // Agent服务器配置
    this.agentServerUrl = 'https://tas-189840-5-1256962331.sh.run.tcloudbase.com';
    
    // 连接超时设置
    this.CONNECTION_TIMEOUT_MS = 180000; // 180秒
    this.connectionTimeout = null;
    this.connectionAbortController = null;
    
    // 保活机制
    this.pingInterval = null;
    this.PING_INTERVAL_MS = 30000; // 30秒
    
    // 消息处理
    this.messageCache = {};
    this.messageHistory = new Set();
    this.messageTimestamps = new Map();
    this.MESSAGE_EXPIRY_TIME = 10000; // 10秒
    
    // 事件回调
    this.onStatusChange = null;
    this.onMessageReceived = null;
    this.onError = null;
    this.onLog = null;
  }

  /**
   * 设置事件回调函数
   */
  setCallbacks({ onStatusChange, onMessageReceived, onError, onLog }) {
    this.onStatusChange = onStatusChange;
    this.onMessageReceived = onMessageReceived;
    this.onError = onError;
    this.onLog = onLog;
  }

  /**
   * 记录日志
   */
  log(message, type = 'info') {
    console.log(`[VoiceChat] ${message}`);
    if (this.onLog) {
      this.onLog(message, type);
    }
  }

  /**
   * 更新状态
   */
  updateStatus(status, type) {
    if (this.onStatusChange) {
      this.onStatusChange(status, type);
    }
  }

  /**
   * 发送错误信息
   */
  sendError(error) {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * 获取Agora Token
   */
  async getAgoraToken(channel, userId) {
    try {
      const requestData = {
        request_id: `token_req_${Date.now()}`,
        channel_name: channel,
        uid: parseInt(userId)
      };

      this.log(`发送Token请求: ${JSON.stringify(requestData)}`);

      const response = await axios.post(`${this.agentServerUrl}/token/generate`, requestData, {
        signal: this.connectionAbortController?.signal,
        timeout: 30000 // 30秒超时
      });

      if (response.data.code === "0") {
        return response.data.data;
      } else {
        throw new Error(response.data.msg || '获取token失败');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('连接已取消');
      }
      this.log(`获取Agora Token失败: ${error.response?.data?.msg || error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 启动Agent
   */
  async startAgent(channel, userId) {
    try {
      const response = await axios.post(`${this.agentServerUrl}/start`, {
        request_id: `req_${Date.now()}`,
        channel_name: channel,
        user_uid: parseInt(userId),
        bot_uid: 987654,
        graph_name: "voice_assistant",
        timeout: -1,
        properties: {
          "openai_chatgpt": {
            "model": "gpt-4o-mini",
            "max_tokens": 1024,
            "temperature": 0.7
          }
        }
      }, {
        signal: this.connectionAbortController?.signal,
        timeout: this.CONNECTION_TIMEOUT_MS
      });

      if (response.data.code === "0") {
        this.log('Agent启动成功', 'success');
        this.agentStarted = true;
        this.startPingAgent(channel);
        return true;
      } else if (response.data.msg && response.data.msg.includes('channel existed')) {
        // 频道已存在，尝试先停止再重新启动
        this.log('检测到频道已存在，尝试重新启动Agent...', 'warning');
        await this.stopAgent(channel);
        // 等待一小段时间让服务器清理频道
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.startAgent(channel, userId);
      } else {
        throw new Error(response.data.msg || 'Agent启动失败');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('连接已取消');
      }
      this.log(`启动Agent失败: ${error.response?.data?.msg || error.message}`, 'error');
      return false;
    }
  }

  /**
   * 启动保活机制
   */
  startPingAgent(channel) {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(async () => {
      try {
        const response = await axios.post(`${this.agentServerUrl}/ping`, {
          request_id: `ping_${Date.now()}`,
          channel_name: channel
        });

        if (response.data.code === "0") {
          this.log(`Agent ping成功 (保持连接)`, 'info');
        } else {
          this.log(`Agent ping失败: ${response.data.msg}`, 'error');
        }
      } catch (error) {
        this.log(`Agent ping错误: ${error.response?.data?.msg || error.message}`, 'error');
      }
    }, this.PING_INTERVAL_MS);

    this.log(`已启动Agent保活机制，每${this.PING_INTERVAL_MS / 1000}秒ping一次`);
  }

  /**
   * 停止保活机制
   */
  stopPingAgent() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
      this.log('已停止Agent保活机制');
    }
  }

  /**
   * 停止Agent
   */
  async stopAgent(channel) {
    try {
      const response = await axios.post(`${this.agentServerUrl}/stop`, {
        request_id: `req_${Date.now()}`,
        channel_name: channel
      });

      if (response.data.code === "0") {
        this.log('Agent停止成功', 'success');
        this.agentStarted = false;
        return true;
      } else {
        this.log(`停止Agent失败: ${response.data.msg}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`停止Agent失败: ${error.response?.data?.msg || error.message}`, 'error');
      return false;
    }
  }

  /**
   * 连接到Agora RTC
   */
  async connectToAgora(appId, token, channel, userId) {
    try {
      // 创建RTC客户端
      this.rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

      // 监听远程用户事件
      this.rtcClient.on("user-published", async (user, mediaType) => {
        this.log(`远程用户发布了${mediaType}: ${user.uid}`, 'success');
        await this.rtcClient.subscribe(user, mediaType);

        if (mediaType === "audio") {
          this.remoteAudioTrack = user.audioTrack;
          if (this.remoteAudioTrack) {
            this.remoteAudioTrack.play();
            this.log('Agent音频开始播放', 'success');
          }
        }
      });

      this.rtcClient.on("user-unpublished", (user, mediaType) => {
        this.log(`远程用户停止发布${mediaType}: ${user.uid}`);
        if (mediaType === "audio") {
          this.remoteAudioTrack = null;
        }
      });

      // 监听消息流
      this.rtcClient.on("stream-message", (uid, stream) => {
        try {
          const rawData = String.fromCharCode(...new Uint8Array(stream));
          this.log(`收到原始数据: ${rawData}`, 'success');
          this.parseStreamMessage(rawData);
        } catch (error) {
          console.error('解析消息失败:', error);
          this.log(`消息解析失败: ${error.message}`, 'error');
        }
      });

      // 加入频道
      await this.rtcClient.join(appId, channel, token, parseInt(userId));
      this.log(`成功加入频道: ${channel}`, 'success');

      // 创建并发布音频轨道
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      await this.rtcClient.publish([this.localAudioTrack]);
      this.log('本地音频已发布', 'success');

      this.isConnected = true;
      this.updateStatus('已连接 - 可以开始语音对话', 'connected');

    } catch (error) {
      this.log(`连接Agora失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 解析流消息
   */
  parseStreamMessage(rawData) {
    try {
      if (rawData.includes('|')) {
        this.handleChunkedMessage(rawData);
      } else {
        this.sendMessage(rawData, 'agent', Date.now());
      }
    } catch (error) {
      console.error('解析流消息失败:', error);
      this.log(`消息解析错误: ${error.message}`, 'error');
    }
  }

  /**
   * 处理分块消息
   */
  handleChunkedMessage(chunkData) {
    try {
      const [message_id, partIndexStr, totalPartsStr, content] = chunkData.split('|');
      const part_index = parseInt(partIndexStr, 10);
      const total_parts = totalPartsStr === '???' ? -1 : parseInt(totalPartsStr, 10);

      if (total_parts === -1) {
        this.log(`消息 ${message_id} 的总分片数未知，等待更多分片`);
        return;
      }

      const chunkInfo = { message_id, part_index, total_parts, content };

      if (!this.messageCache[message_id]) {
        this.messageCache[message_id] = [];
        setTimeout(() => {
          if (this.messageCache[message_id] && this.messageCache[message_id].length !== total_parts) {
            this.log(`不完整消息 ${message_id} 已被丢弃`, 'error');
            delete this.messageCache[message_id];
          }
        }, 5000);
      }

      this.messageCache[message_id].push(chunkInfo);

      if (this.messageCache[message_id].length === total_parts) {
        const completeMessage = this.reconstructMessage(this.messageCache[message_id]);
        this.processCompleteMessage(completeMessage, message_id);
        delete this.messageCache[message_id];
      }
    } catch (error) {
      console.error('处理分块消息失败:', error);
      this.log(`分块消息处理错误: ${error.message}`, 'error');
    }
  }

  /**
   * 重构完整消息
   */
  reconstructMessage(chunks) {
    chunks.sort((a, b) => a.part_index - b.part_index);
    return chunks.map(chunk => chunk.content).join('');
  }

  /**
   * 处理完整消息
   */
  processCompleteMessage(completeMessage, messageId) {
    try {
      const decodedMessage = this.base64ToUtf8(completeMessage);
      const parsedData = JSON.parse(decodedMessage);
      const { stream_id, is_final, text, text_ts, data_type, role } = parsedData;

      this.log(`消息 [${messageId}]: ${role}, ${is_final ? '最终' : '中间'}, "${text?.substring(0, 30)}..."`);

      if (text && text.trim().length > 0 && is_final) {
        const messageType = role === 'assistant' ? 'agent' : 'user';
        const timestamp = text_ts || Date.now();

        if (!this.isDuplicateMessage(text, role)) {
          this.sendMessage(text, messageType, timestamp);
          this.log(`✅ 显示${messageType}消息: "${text.substring(0, 30)}..."`, 'success');
        } else {
          this.log(`🔄 跳过重复${messageType}消息: "${text.substring(0, 30)}..."`, 'info');
        }
      } else {
        this.log(`⏭️ 跳过非最终消息或空文本`);
      }
    } catch (error) {
      console.error('处理完整消息失败:', error);
      this.log(`完整消息处理错误: ${error.message}`, 'error');
    }
  }

  /**
   * Base64解码
   */
  base64ToUtf8(base64) {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch (error) {
      console.error('Base64解码失败:', error);
      return base64;
    }
  }

  /**
   * 检查重复消息
   */
  isDuplicateMessage(text, role) {
    const fingerprint = this.generateMessageFingerprint(text, role);
    if (this.messageHistory.has(fingerprint)) {
      return true;
    }

    this.messageHistory.add(fingerprint);
    this.messageTimestamps.set(fingerprint, Date.now());

    if (Math.random() < 0.1) {
      this.cleanupExpiredMessages();
    }

    return false;
  }

  /**
   * 生成消息指纹
   */
  generateMessageFingerprint(text, role) {
    const normalizedText = text.trim().toLowerCase();
    return `${role}_${normalizedText.length}_${normalizedText.substring(0, 50)}`;
  }

  /**
   * 清理过期消息
   */
  cleanupExpiredMessages() {
    const now = Date.now();
    for (const [fingerprint, timestamp] of this.messageTimestamps.entries()) {
      if (now - timestamp > this.MESSAGE_EXPIRY_TIME) {
        this.messageHistory.delete(fingerprint);
        this.messageTimestamps.delete(fingerprint);
      }
    }
  }

  /**
   * 发送消息到UI
   */
  sendMessage(text, type, timestamp) {
    if (this.onMessageReceived) {
      this.onMessageReceived(text, type, timestamp);
    }
  }

  /**
   * 连接Agent
   */
  async connectAgent(channel = 'test_channel_001', userId = 123456) {
    // 防止重复连接
    if (this.isConnecting || this.isConnected) {
      this.log('已在连接中或已连接，跳过重复连接请求');
      return false;
    }

    this.currentChannel = channel;
    this.currentUserId = parseInt(userId);
    this.isConnecting = true;

    // 创建连接取消控制器
    this.connectionAbortController = new AbortController();

    // 设置连接超时
    this.connectionTimeout = setTimeout(() => {
      // 检查是否仍在连接中（防止竞态条件）
      if (!this.isConnecting) {
        return;
      }
      
      this.log(`连接超时 (${this.CONNECTION_TIMEOUT_MS / 1000}秒)`, 'error');
      this.updateStatus('连接超时', 'disconnected');
      this.sendError(`连接超时，请检查网络连接后重试`);
      
      // 清理连接资源（不调用cancelConnection避免循环调用）
      this.cleanupConnectionResources();
    }, this.CONNECTION_TIMEOUT_MS);

    this.updateStatus(`连接中... (超时时间: ${this.CONNECTION_TIMEOUT_MS / 1000}秒)`, 'connecting');
    this.log(`开始连接到服务器: ${this.agentServerUrl}`);
    this.log(`频道: ${channel}, 用户ID: ${userId}`);

    try {
      // 1. 启动Agent
      this.log('正在启动Agent...', 'info');
      this.updateStatus('正在启动Agent...', 'connecting');
      const agentSuccess = await this.startAgent(channel, userId);

      if (!agentSuccess) {
        throw new Error('Agent启动失败');
      }

      // 2. 获取Agora Token
      this.log('正在获取Agora Token...', 'info');
      this.updateStatus('正在获取Token...', 'connecting');
      const tokenData = await this.getAgoraToken(channel, userId);

      // 3. 连接到Agora RTC
      this.log('正在连接Agora RTC...', 'info');
      this.updateStatus('正在连接语音服务...', 'connecting');
      await this.connectToAgora(tokenData.appId, tokenData.token, channel, userId);

      // 清除超时定时器（连接成功）
      this.clearConnectionTimeout();

      this.isConnecting = false;
      this.log('✅ 连接成功！现在可以开始语音对话了', 'success');

      // 清空消息历史
      this.messageHistory.clear();
      this.messageTimestamps.clear();
      this.log('🧹 已清空消息历史记录');

      // 发送连接成功消息
      this.sendMessage(`✨ 已成功连接到频道 "${channel}"！请开始说话吧！`, 'system', Date.now());

      return true;
    } catch (error) {
      // 清除超时定时器（连接失败）
      this.clearConnectionTimeout();

      this.isConnecting = false;
      this.updateStatus('连接失败', 'disconnected');
      
      if (error.message === '连接已取消') {
        this.log('连接已被用户取消', 'info');
        this.sendError('连接已取消');
      } else {
        this.sendError(`连接失败: ${error.message}`);
        this.log(`连接失败: ${error.message}`, 'error');
      }
      
      return false;
    }
  }

  /**
   * 清理连接超时定时器
   */
  clearConnectionTimeout() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
      this.log('已清理连接超时定时器', 'info');
    }
  }

  /**
   * 清理连接资源（不调用完整的断开连接流程）
   */
  cleanupConnectionResources() {
    this.log('正在清理连接资源...', 'info');

    // 取消所有进行中的请求
    if (this.connectionAbortController) {
      this.connectionAbortController.abort();
      this.connectionAbortController = null;
    }

    // 清除超时定时器
    this.clearConnectionTimeout();

    // 停止保活机制
    this.stopPingAgent();

    // 重置连接状态
    this.isConnecting = false;
    this.agentStarted = false;
    
    this.log('连接资源清理完成', 'info');
  }

  /**
   * 取消连接
   */
  async cancelConnection() {
    if (!this.isConnecting) {
      return;
    }

    this.log('正在取消连接...', 'info');

    // 清理连接资源
    this.cleanupConnectionResources();

    // 清理已创建的资源
    await this.disconnectAgent();

    this.updateStatus('连接已取消', 'disconnected');
    this.log('连接已取消', 'info');
  }

  /**
   * 断开连接
   */
  async disconnectAgent() {
    this.log('正在断开连接...', 'info');
    this.updateStatus('断开中...', 'connecting');

    try {
      // 清理连接资源（避免重复清理）
      this.cleanupConnectionResources();

      // 停止本地音频轨道
      if (this.localAudioTrack) {
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      // 离开频道
      if (this.rtcClient) {
        await this.rtcClient.leave();
        this.rtcClient = null;
      }

      // 停止Agent（确保服务器端频道被清理）
      if (this.currentChannel) {
        this.log('正在清理服务器端频道资源...', 'info');
        await this.stopAgent(this.currentChannel);
      }

      this.isConnected = false;
      this.isMuted = false;
      this.remoteAudioTrack = null;

      this.updateStatus('已断开连接', 'disconnected');
      this.log('✅ 断开连接成功', 'success');

      // 发送断开连接消息（仅在之前已连接的情况下）
      if (this.isConnected) {
        this.sendMessage('👋 已断开连接，期待下次对话！', 'system', Date.now());
      }

      return true;
    } catch (error) {
      this.log(`断开连接失败: ${error.message}`, 'error');
      this.isConnected = false;
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * 切换静音状态
   */
  toggleMute() {
    if (!this.localAudioTrack) return false;

    this.isMuted = !this.isMuted;
    this.localAudioTrack.setMuted(this.isMuted);
    this.log(this.isMuted ? '已静音' : '已取消静音', 'info');
    return this.isMuted;
  }

  /**
   * 获取音频可视化数据
   */
  getAudioVisualizationData() {
    if (!this.localAudioTrack || !this.isConnected) {
      return null;
    }

    try {
      const mediaStreamTrack = this.localAudioTrack.getMediaStreamTrack();
      return mediaStreamTrack;
    } catch (error) {
      console.error('获取音频可视化数据失败:', error);
      return null;
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 取消连接
    if (this.connectionAbortController) {
      this.connectionAbortController.abort();
      this.connectionAbortController = null;
    }

    // 清除超时定时器
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.disconnectAgent();
    this.messageCache = {};
    this.messageHistory.clear();
    this.messageTimestamps.clear();
  }
}

export default VoiceChat;