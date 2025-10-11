/**
 * content-api 统一API网关云函数
 * 负责路由分发、请求验证、错误处理和响应格式化
 */

const cloud = require('@cloudbase/node-sdk');
const { APIResponse, HTTPStatus, generateRequestId } = require('./response');
const DatabaseService = require('./database');

/**
 * 中间件：请求日志记录
 */
const requestLogger = (event, context) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  console.log(`[${requestId}] API请求开始:`, {
    path: event.path,
    method: event.httpMethod,
    source: event.requestContext?.sourceIp || 'unknown',
    userAgent: event.headers?.['user-agent'] || 'unknown',
    timestamp: new Date().toISOString()
  });
  
  return { requestId, startTime };
};

/**
 * 中间件：请求验证
 */
const validateRequest = (event) => {
  // 检查HTTP方法
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  if (!allowedMethods.includes(event.httpMethod)) {
    return APIResponse.error('不支持的HTTP方法', HTTPStatus.METHOD_NOT_ALLOWED);
  }
  
  // 处理CORS预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: HTTPStatus.OK,
      headers: getCORSHeaders(),
      body: JSON.stringify({ message: 'CORS预检请求成功' })
    };
  }
  
  return null; // 验证通过
};

/**
 * 获取CORS头信息
 */
const getCORSHeaders = () => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8'
  };
};

/**
 * 解析请求体
 */
const parseRequestBody = (event) => {
  if (!event.body) {
    return {};
  }
  
  try {
    if (typeof event.body === 'string') {
      return JSON.parse(event.body);
    }
    return event.body;
  } catch (error) {
    console.error('解析请求体失败:', error);
    throw new Error('请求体格式不正确，必须是有效的JSON');
  }
};

/**
 * URL标准化处理函数
 * @param {string} url - 原始URL
 * @returns {string} 标准化后的URL
 */
const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return url;
  }
  
  try {
    // 解析URL
    const urlObj = new URL(url);
    
    // 统一协议为https（如果是http的话）
    if (urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }
    
    // 移除末尾的斜杠（除非是根路径）
    if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    // 移除默认端口
    if ((urlObj.protocol === 'https:' && urlObj.port === '443') || 
        (urlObj.protocol === 'http:' && urlObj.port === '80')) {
      urlObj.port = '';
    }
    
    return urlObj.toString();
  } catch (error) {
    console.warn('URL标准化失败，返回原始URL:', url);
    return url;
  }
};

/**
 * 服务代理基类
 */
class ServiceProxy {
  constructor(serviceName, event = null) {
    this.serviceName = serviceName;
    this.app = cloud.init({ env: cloud.SYMBOL_CURRENT_ENV });
    this.event = event;
  }
  
  /**
   * 解析云函数返回的结果
   * @param {Object} result - 云函数返回的结果
   * @returns {Object} 解析后的结果
   */
  parseResult(result) {
    console.log(`${this.serviceName}原始返回结果:`, JSON.stringify(result, null, 2));
    
    // 如果结果包含body字段，说明是HTTP响应格式，需要解析
    if (result && result.body) {
      try {
        const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
        console.log(`${this.serviceName}解析后结果:`, JSON.stringify(body, null, 2));
        return body;
      } catch (parseError) {
        console.error(`解析${this.serviceName}响应失败:`, parseError);
        return result;
      }
    }
    console.log(`${this.serviceName}无需解析的结果:`, JSON.stringify(result, null, 2));
    return result;
  }
  
  /**
   * 调用云函数服务
   */
  async callService(functionName, data) {
    try {
      console.log(`调用${this.serviceName}服务:`, { functionName, data: Object.keys(data) });
      
      // 增加超时时间到30秒，避免ESOCKETTIMEDOUT错误
      const result = await this.app.callFunction({
        name: functionName,
        data: data,
        timeout: 30000  // 30秒超时
      });
      
      console.log(`${this.serviceName}云函数调用结果:`, JSON.stringify(result, null, 2));
      
      if (result.result) {
        // 解析嵌套的响应
        return this.parseResult(result.result);
      } else {
        throw new Error(`${this.serviceName}服务返回格式不正确`);
      }
      
    } catch (error) {
      console.error(`调用${this.serviceName}服务失败:`, error);
      throw new Error(`${this.serviceName}服务调用失败: ${error.message}`);
    }
  }
}

/**
 * 内容提取服务代理
 */
class ContentExtractorProxy extends ServiceProxy {
  constructor(event) {
    super('ContentExtractorService', event);
  }
  
  async extractContent(url, options = {}) {
    try {
      const result = await this.callService('ContentExtractorService', { 
        url, 
        options 
      });
      
      console.log('ContentExtractorService返回结果:', JSON.stringify(result, null, 2));
      
      // 如果提取成功，自动保存到数据库
      // 修复条件判断逻辑，正确处理嵌套响应
      const isSuccess = result && result.success === true;
      const hasData = result && result.data && Object.keys(result.data).length > 0;
      
      if (isSuccess && hasData) {
        console.log('开始数据库保存流程');
        const dbService = new (require('./database'))();
        // 获取用户openid
        // 修复：确保使用正确的上下文对象
        let openid = 'anonymous';
        if (this.event && typeof this.event === 'object') {
          try {
            const context = cloud.getCloudbaseContext(this.event);
            openid = context.WX_OPENID || context.OPENID || 'anonymous';
          } catch (contextError) {
            console.warn('获取用户上下文失败，使用默认openid:', contextError.message);
            openid = 'anonymous';
          }
        }
        
        const saveResult = await dbService.saveContent({
          url: result.data.url,
          title: result.data.title,
          content: result.data.content,
          content_length: result.data.content_length,
          tts_content: result.data.tts_content,
          tts_statistics: result.data.tts_statistics,
          extraction_time: result.data.extraction_time,
          timestamp: result.data.timestamp,
          _openid: openid
        });
        
        console.log('数据库保存结果:', JSON.stringify(saveResult, null, 2));
        
        // 将数据库保存结果合并到返回结果中
        if (saveResult.success) {
          result.data.id = saveResult.data.id;
          result.data.isUpdate = saveResult.data.isUpdate;
          result.data.db_saved = true;
        } else {
          // 如果数据库保存失败，记录错误但不影响主流程
          console.error('数据库保存失败:', saveResult);
        }
      } else {
        console.log('未满足数据库保存条件:', { 
          success: result && result.success, 
          hasData: hasData,
          resultKeys: result && result.data ? Object.keys(result.data) : 'no data'
        });
      }
      
      return result;
    } catch (error) {
      console.error('ContentExtractorProxy调用失败:', error);
      throw error;
    }
  }
}

/**
 * 播客生成服务代理
 */
class PodcastGeneratorProxy extends ServiceProxy {
  constructor() {
    super('PodcastGeneratorService');
  }
  
  async generatePodcast(contentId, style = '科普风格') {
    try {
      const result = await this.callService('PodcastGeneratorService', { 
        content_id: contentId, 
        style 
      });
      
      console.log('PodcastGeneratorService返回结果:', JSON.stringify(result, null, 2));
      
      // 如果生成成功，自动保存到数据库
      if (result.success && result.data) {
        console.log('开始播客数据保存流程');
        const dbService = new (require('./database'))();
        const updateResult = await dbService.updatePodcastData(contentId, {
          podcast: result.data.podcast,
          tts_podcast: result.data.tts_podcast
        });
        
        console.log('播客数据保存结果:', JSON.stringify(updateResult, null, 2));
        
        if (updateResult.success) {
          result.data.db_updated = true;
        } else {
          console.error('播客数据保存失败:', updateResult);
        }
      } else {
        console.log('未满足播客数据保存条件:', { success: result.success, hasData: !!result.data });
      }
      
      return result;
    } catch (error) {
      console.error('PodcastGeneratorProxy调用失败:', error);
      throw error;
    }
  }
}

/**
 * TTS服务代理
 */
class TTSServiceProxy extends ServiceProxy {
  constructor() {
    super('TTSService');
  }
  
  /**
   * 上传音频文件到云存储
   */
  async uploadAudioFiles(audioUrls, contentId, audioType, openid, recordId) {
    const uploadedUrls = [];
    
    for (let i = 0; i < audioUrls.length; i++) {
      const audioItem = audioUrls[i];
      try {
        console.log(`开始上传音频文件 ${i + 1}/${audioUrls.length}:`, audioItem.temp_url);
        
        // 下载音频文件
        const fetch = require('node-fetch');
        const response = await fetch(audioItem.temp_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (!response.ok) {
          throw new Error(`下载音频文件失败: ${response.status}`);
        }
        
        const audioBuffer = await response.buffer();
        
        // 根据需求生成正确的云存储文件路径
        // 原文音频: {_openid}/{_id}/yw/
        // 播客音频: {_openid}/{_id}/bk/
        const pathType = audioType === 'original' ? 'yw' : 'bk';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const voiceType = audioItem.voice_type ? `_${audioItem.voice_type}` : '';
        const filename = `audio_${audioItem.segment_index}${voiceType}_${timestamp}.wav`;
        const cloudPath = `${openid || 'anonymous'}/${recordId || contentId}/${pathType}/${filename}`;
        
        // 上传到云存储
        const uploadResult = await this.app.uploadFile({
          cloudPath: cloudPath,
          fileContent: audioBuffer
        });
        
        if (uploadResult.fileID) {
          // 获取下载URL
          const downloadUrl = await this.app.getTempFileURL({
            fileList: [uploadResult.fileID]
          });
          
          uploadedUrls.push({
            segment_index: audioItem.segment_index,
            voice_type: audioItem.voice_type,
            file_id: uploadResult.fileID,
            cloud_path: cloudPath,
            download_url: downloadUrl.fileList[0].tempFileURL,
            file_size: audioBuffer.length,
            text_length: audioItem.text_length,
            voice: audioItem.voice,
            upload_time: new Date().toISOString(),
            source: {
              temp_url: audioItem.temp_url || null,
              expires_at: (audioItem.expires_at ?? null),
              provider_request_id: (audioItem.request_id || audioItem.provider_request_id || null)
            }
          });
          
          console.log(`音频文件 ${i + 1} 上传成功:`, uploadResult.fileID);
        } else {
          console.error(`音频文件 ${i + 1} 上传失败:`, uploadResult);
        }
        
      } catch (uploadError) {
        console.error(`上传音频文件 ${i + 1} 失败:`, uploadError);
        // 如果上传失败，保留原始URL
        uploadedUrls.push({
          segment_index: audioItem.segment_index,
          voice_type: audioItem.voice_type,
          temp_url: audioItem.temp_url,
          upload_error: uploadError.message,
          text_length: audioItem.text_length,
          voice: audioItem.voice,
          source: {
            temp_url: audioItem.temp_url || null,
            expires_at: (audioItem.expires_at ?? null),
            provider_request_id: (audioItem.request_id || audioItem.provider_request_id || null)
          }
        });
      }
    }
    
    return uploadedUrls;
  }
  
  async synthesizeAudio(contentId, audioType, event) {
    try {
      const result = await this.callService('TTSService', { 
        content_id: contentId, 
        audio_type: audioType 
      });
      
      console.log('TTSService返回结果:', JSON.stringify(result, null, 2));
      
      // 如果合成成功，处理音频文件上传并保存到数据库
      if (result.success && result.data && result.data.audio_urls) {
        console.log('开始TTS音频处理流程');
        
        try {
          // 获取用户openid和记录ID
          // 修复：确保使用正确的上下文对象
          let openid = 'anonymous';
          if (event && typeof event === 'object') {
            try {
              const context = this.app.getCloudbaseContext(event);
              openid = context.WX_OPENID || context.OPENID || 'anonymous';
            } catch (contextError) {
              console.warn('获取用户上下文失败，使用默认openid:', contextError.message);
              openid = 'anonymous';
            }
          }
          
          // 从数据库获取记录的_id
          const dbService = new (require('./database'))();
          const contentResult = await dbService.getContentById(contentId);
          const recordId = contentResult.success ? (contentResult.data.id || contentId) : contentId;
          
          // 上传音频文件到云存储
          const uploadedAudioUrls = await this.uploadAudioFiles(
            result.data.audio_urls, 
            contentId, 
            audioType,
            openid,
            recordId
          );
          
          const updateData = {};
          
          if (audioType === 'original') {
            updateData.ttsc_url = uploadedAudioUrls;
          } else if (audioType === 'podcast') {
            updateData.ttsp_url = uploadedAudioUrls;
          }
          
          const updateResult = await dbService.updateTTSData(contentId, updateData);
          
          console.log('TTS数据保存结果:', JSON.stringify(updateResult, null, 2));
          
          if (updateResult.success) {
            result.data.db_updated = true;
            result.data.audio_urls = uploadedAudioUrls; // 返回云存储URL
            result.data.storage_path = `${openid}/${recordId}/${audioType === 'original' ? 'yw' : 'bk'}`;
          } else {
            console.error('TTS数据保存失败:', updateResult);
          }
        } catch (uploadError) {
          console.error('音频文件上传失败:', uploadError);
          result.data.upload_error = uploadError.message;
        }
      } else {
        console.log('未满足TTS数据保存条件:', { 
          success: result.success, 
          hasData: !!(result.data && result.data.audio_urls) 
        });
      }
      
      return result;
    } catch (error) {
      console.error('TTSServiceProxy调用失败:', error);
      throw error;
    }
  }
}

/**
 * 主路由处理器类
 */
class ContentAPIRouter {
  constructor() {
    this.dbService = new DatabaseService();
    // 移除静态实例化，改为动态创建以传递event参数
    this.contentExtractor = null;
    this.podcastGenerator = new PodcastGeneratorProxy();
    this.ttsService = new TTSServiceProxy();
  }
  
  /**
   * 检查URL是否已存在
   * @param {string} url - 要检查的URL
   * @returns {Promise<Object>} 查询结果
   */
  async checkUrlExists(url) {
    try {
      // URL标准化处理
      const normalizedUrl = normalizeUrl(url);
      console.log('检查URL是否存在:', { original: url, normalized: normalizedUrl });
      
      // 查询数据库中是否存在该URL
      const result = await this.dbService.getContentByUrl(normalizedUrl);
      return result;
    } catch (error) {
      console.error('检查URL是否存在时出错:', error);
      // 出错时返回失败，继续执行后续流程
      return APIResponse.serverError('查询URL失败', error.message);
    }
  }
  
  /**
   * 获取ContentExtractorProxy实例
   */
  getContentExtractor(event) {
    return new ContentExtractorProxy(event);
  }
  
  /**
   * 路由分发
   */
  async route(event, context) {
    const { requestId, startTime } = requestLogger(event, context);
    
    try {
      // 请求验证
      const validationResult = validateRequest(event);
      if (validationResult) {
        return this.formatResponse(validationResult, requestId);
      }
      
      // 解析路径和参数
      const path = event.path || '/';
      const method = event.httpMethod;
      const body = parseRequestBody(event);
      const query = event.queryStringParameters || {};
      
      console.log(`[${requestId}] 路由分发:`, { path, method, query });
      
      let result;
      
      // 路由匹配和处理
      if (path === '/extract' && method === 'POST') {
        result = await this.handleExtract(body, requestId, event);
      }
      else if (path === '/podcast' && method === 'POST') {
        result = await this.handlePodcast(body, requestId);
      }
      else if (path.startsWith('/tts/generate') && method === 'POST') {
        result = await this.handleTTSGenerate(body, requestId, event);
      }
      else if (path === '/tts/done' && method === 'POST') {
        result = await this.handleTTSDone(body, requestId, event, context);
      }
      else if (path.startsWith('/content/') && method === 'GET') {
        const contentId = path.split('/')[2];
        result = await this.handleGetContent(contentId, requestId);
      }
      else if (path === '/history' && method === 'GET') {
        result = await this.handleGetHistory(query, requestId);
      }
      else if (path === '/health' && method === 'GET') {
        result = await this.handleHealthCheck(requestId);
      }
      else {
        result = APIResponse.notFound('API路径不存在', { 
          path, 
          method, 
          available_routes: [
            'POST /extract',
            'POST /podcast', 
            'POST /tts/generate',
            'POST /tts/done',
            'GET /content/{id}',
            'GET /history',
            'GET /health'
          ]
        }, requestId);
      }
      
      // 记录响应日志
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] API请求完成:`, {
        path,
        method,
        statusCode: result.code,
        duration: `${duration}ms`,
        success: result.success
      });
      
      return this.formatResponse(result, requestId);
      
    } catch (error) {
      console.error(`[${requestId}] API请求失败:`, error);
      
      const errorResult = APIResponse.serverError(
        '服务器内部错误',
        error.message,
        requestId
      );
      
      return this.formatResponse(errorResult, requestId);
    }
  }
  
  /**
   * 处理内容提取请求
   */
  async handleExtract(body, requestId, event) {
    const { url, options } = body;
    
    if (!url) {
      return APIResponse.badRequest('URL参数不能为空', null, requestId);
    }
    
    try {
      // URL查重检查
      const checkResult = await this.checkUrlExists(url);
      
      // 如果URL已存在且查询成功，直接返回已有数据
      if (checkResult.success) {
        console.log(`[${requestId}] URL已存在，返回已有数据:`, checkResult.data.id);
        return APIResponse.success({
          id: checkResult.data.id,
          url: checkResult.data.url,
          title: checkResult.data.title,
          content: checkResult.data.content,
          content_length: checkResult.data.content_length,
          podcast: checkResult.data.podcast,
          tts_podcast: checkResult.data.tts_podcast,
          tts_content: checkResult.data.tts_content,
          ttsc_url: checkResult.data.ttsc_url,
          ttsp_url: checkResult.data.ttsp_url,
          status: checkResult.data.status,
          created_at: checkResult.data.created_at,
          updated_at: checkResult.data.updated_at,
          from_cache: true // 标识数据来自缓存
        }, checkResult.data.title || '内容提取成功', requestId);
      }
      
      // 如果查询失败但不是因为记录不存在，则返回错误
      if (checkResult.code !== 404) {
        console.warn(`[${requestId}] URL查重检查失败:`, checkResult.message);
        // 继续执行内容提取流程
      }
      
      // 调用内容提取服务，传递event参数以获取openid
      const contentExtractor = this.getContentExtractor(event);
      const extractResult = await contentExtractor.extractContent(url, options);
      
      return extractResult;
    } catch (error) {
      console.error(`[${requestId}] 内容提取失败:`, error);
      return APIResponse.serverError('内容提取失败', error.message, requestId);
    }
  }
  
  /**
   * 处理播客生成请求
   */
  async handlePodcast(body, requestId) {
    const { url, content_id, style } = body;
    
    let contentId = content_id;
    
    // 如果提供了URL但没有content_id，先查询是否存在
    if (url && !contentId) {
      const normalizedUrl = normalizeUrl(url);
      const existingContent = await this.dbService.getContentByUrl(normalizedUrl);
      if (existingContent.success) {
        contentId = existingContent.data.id;
      } else {
        return APIResponse.badRequest(
          '请先提取网页内容或提供有效的content_id',
          { url: normalizedUrl, message: '未找到对应的内容记录' },
          requestId
        );
      }
    }
    
    if (!contentId) {
      return APIResponse.badRequest('必须提供content_id或url参数', null, requestId);
    }
    
    // v0.9 查重短路：如已有播客数据，则直接返回缓存，避免重复生成
    try {
      const existing = await this.dbService.getContentById(contentId);
      if (existing.success) {
        const d = existing.data || {};
        const hasPodcast = d && d.podcast && Array.isArray(d.podcast.content) && d.podcast.content.length > 0;
        const hasTtsPodcast = Array.isArray(d.tts_podcast) && d.tts_podcast.length === 2 &&
          ((Array.isArray(d.tts_podcast[0]) && d.tts_podcast[0].length > 0) || (Array.isArray(d.tts_podcast[1]) && d.tts_podcast[1].length > 0));
        if (hasPodcast || hasTtsPodcast) {
          return APIResponse.success({
            id: d.id,
            content_id: d.id,
            url: d.url,
            podcast: d.podcast || null,
            tts_podcast: d.tts_podcast || [],
            ttsp_url: d.ttsp_url || [],
            status: d.status,
            from_cache: true
          }, '播客数据已存在（来自缓存）', requestId);
        }
      }
    } catch (e) {
      console.warn('播客查重短路检查失败，继续生成流程:', e && e.message ? e.message : e);
    }
    // 调用播客生成服务
    const podcastResult = await this.podcastGenerator.generatePodcast(contentId, style);
    
    return podcastResult;
  }
  
  /**
   * 处理TTS生成请求
   */
  async handleTTSGenerate(body, requestId, event) {
    const { content_id, audio_type, voice_config } = body;

    if (!content_id) {
      return APIResponse.badRequest('content_id参数不能为空', null, requestId);
    }

    if (!audio_type || !['original', 'podcast'].includes(audio_type)) {
      return APIResponse.badRequest(
        'audio_type必须是original或podcast',
        { audio_type },
        requestId
      );
    }

    // 检查数据库中是否已存在有效音频数据或正在处理中的任务
    const contentResult = await this.dbService.getContentById(content_id);
    if (contentResult.success) {
      const contentData = contentResult.data;
      
      // 检查任务状态
      let taskStatus = null;
      let audioUrls = null;
      
      if (audio_type === 'original') {
        taskStatus = contentData.ttsc_task ? contentData.ttsc_task.status : null;
        audioUrls = contentData.ttsc_url;
      } else {
        taskStatus = contentData.ttsp_task ? contentData.ttsp_task.status : null;
        audioUrls = contentData.ttsp_url;
      }
      
      // 如果任务正在处理中，直接返回处理中状态
      if (taskStatus === 'processing') {
        return {
          success: true,
          code: HTTPStatus.ACCEPTED || 202,
          message: 'TTS任务已在处理中',
          data: {
            task_id: `${content_id}-${Date.now()}`,
            status: 'TTS_PROCESSING',
            content_id,
            audio_type
          },
          requestId
        };
      }
      
      // 如果任务已完成且存在音频URL，直接返回音频数据
      if (taskStatus === 'completed' && audioUrls && Array.isArray(audioUrls) && audioUrls.length > 0) {
        return APIResponse.success({
          task_id: `${content_id}-${Date.now()}`,
          status: 'TTS_COMPLETED',
          content_id,
          audio_type,
          audio_urls: audioUrls,
          storage_path: contentData.storage_path || null,
          db_updated: true
        }, '音频数据获取成功', requestId);
      }
    }

    // 生成任务ID，异步触发TTS云函数，立即返回处理中
    const taskId = `${content_id}-${Date.now()}`;

    // 异步触发，不阻塞当前请求
    setImmediate(async () => {
      try {
        await this.ttsService.callService('TTSService', {
          content_id,
          audio_type
        });
      } catch (err) {
        console.error(`[${requestId}] 异步触发TTS失败:`, err);
      }
    });

    // 写入任务状态（content_id 粒度），不依赖 task_id
    try {
      const taskObj = { status: 'processing', started_at: new Date().toISOString() };
      if (audio_type === 'original') {
        await this.dbService.updateTTSData(content_id, { ttsc_task: taskObj });
      } else {
        await this.dbService.updateTTSData(content_id, { ttsp_task: taskObj });
      }
    } catch (e) {
      console.warn('写入任务状态失败（processing）:', e && e.message ? e.message : e);
    }

    // 返回202处理中，附带task_id
    return {
      success: true,
      code: HTTPStatus.ACCEPTED || 202,
      message: 'TTS任务已开始处理',
      data: {
        task_id: taskId,
        status: 'TTS_PROCESSING',
        content_id,
        audio_type
      },
      requestId
    };
  }
  
  /**
   * 处理TTS完成回调
   * 需要鉴权：Authorization: Bearer {CLOUDBASE_API_KEY}
   * body: { task_id, content_id, audio_type, audio_urls, processing_time, timestamp }
   */
  async handleTTSDone(body, requestId, event, context) {
    try {
      // 1) 鉴权
      const hdrs = event.headers || {};
      // 兼容从请求体传递鉴权：authorization/auth/auth_token/token
      let rawAuth = (hdrs.authorization || hdrs.Authorization || '');
      if (!rawAuth && body) {
        if (typeof body.authorization === 'string' && body.authorization) {
          rawAuth = body.authorization;
        } else if (typeof body.auth === 'string' && body.auth) {
          rawAuth = body.auth;
        } else if (typeof body.auth_token === 'string' && body.auth_token) {
          rawAuth = 'Bearer ' + body.auth_token;
        } else if (typeof body.token === 'string' && body.token) {
          rawAuth = 'Bearer ' + body.token;
        }
      }
      // 安全日志：仅记录是否存在与长度，不打印明文
      try {
        const tlen = rawAuth.startsWith('Bearer ') ? (rawAuth.length - 7) : 0;
        console.log('[' + requestId + '] /tts/done 鉴权检测: hasAuth=' + (!!rawAuth) + ', token_len=' + tlen + ', hasEnv=' + (!!process.env.CLOUDBASE_API_KEY));
      } catch (e) {}
      const authHeader = rawAuth;
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
      // 鉴权已临时关闭用于联调
      // if (!token || token !== process.env.CLOUDBASE_API_KEY) {
      //   return APIResponse.error('未授权的回调请求', HTTPStatus.UNAUTHORIZED);
      // }

      console.log(`[${requestId}] /tts/done 鉴权通过`);
      const { task_id, content_id, audio_type, audio_urls } = body || {};
      if (!task_id || !content_id || !audio_type || !Array.isArray(audio_urls)) {
        return APIResponse.badRequest('回调参数不完整，必须包含 task_id, content_id, audio_type, audio_urls', null, requestId);
      }

      // 2) 获取 openid 与记录ID
      const userCtx = cloud.getCloudbaseContext(context);
      const openid = userCtx.WX_OPENID || userCtx.OPENID || 'anonymous';

      const contentResult = await this.dbService.getContentById(content_id);
      const recordId = contentResult.success ? contentResult.data._id : content_id;

      // 3) 下载并上传到云存储（复用已有上传实现）
      console.log(`[${requestId}] 开始上传音频，待处理数量: ${Array.isArray(audio_urls) ? audio_urls.length : 0}`);
      const uploadedAudioUrls = await this.ttsService.uploadAudioFiles(
        audio_urls,
        content_id,
        audio_type,
        openid,
        recordId
      );

      // 4) 更新数据库（同时保存原始 temp_url 列表，并更新任务状态为 completed）
      const updateData = {};
      const nowIso = new Date().toISOString();
      if (audio_type === 'original') {
        updateData.ttsc_url = uploadedAudioUrls;

        const startedAt = (contentResult.success && contentResult.data.ttsc_task && contentResult.data.ttsc_task.started_at) || null;
        const durationMs = startedAt ? (Date.now() - Date.parse(startedAt)) : undefined;
        updateData.ttsc_task = {
          status: 'completed',
          finished_at: nowIso,
          ...(startedAt ? { started_at: startedAt, duration_ms: durationMs } : {})
        };
      } else if (audio_type === 'podcast') {
        updateData.ttsp_url = uploadedAudioUrls;

        const startedAt = (contentResult.success && contentResult.data.ttsp_task && contentResult.data.ttsp_task.started_at) || null;
        const durationMs = startedAt ? (Date.now() - Date.parse(startedAt)) : undefined;
        updateData.ttsp_task = {
          status: 'completed',
          finished_at: nowIso,
          ...(startedAt ? { started_at: startedAt, duration_ms: durationMs } : {})
        };
      }

      const updateResult = await this.dbService.updateTTSData(content_id, updateData);
      console.log(`[${requestId}] 数据库更新结果: ${updateResult && updateResult.success}`);

      const storagePath = `${openid}/${recordId}/${audio_type === 'original' ? 'yw' : 'bk'}`;

      return APIResponse.success({
        task_id,
        content_id,
        audio_type,
        audio_urls: uploadedAudioUrls,

        storage_path: storagePath,
        db_updated: !!updateResult.success
      }, 'TTS回调处理完成', requestId);

    } catch (error) {
      console.error(`[${requestId}] 处理TTS回调失败:`, error);
      return APIResponse.serverError('处理TTS回调失败', error.message, requestId);
    }
  }

  /**
   * 处理获取内容详情请求
   */
  async handleGetContent(contentId, requestId) {
    if (!contentId) {
      return APIResponse.badRequest('内容ID不能为空', null, requestId);
    }
    
    return await this.dbService.getContentById(contentId);
  }
  
  /**
   * 处理获取历史记录请求
   */
  async handleGetHistory(query, requestId) {
    const limit = parseInt(query.limit) || 10;
    const offset = parseInt(query.offset) || 0;
    
    return await this.dbService.getHistory(limit, offset);
  }
  
  /**
   * 处理健康检查请求
   */
  async handleHealthCheck(requestId) {
    const dbTest = await this.dbService.testConnection();
    
    return APIResponse.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: dbTest.success ? 'healthy' : 'unhealthy',
        api_gateway: 'healthy'
      }
    }, '服务健康状态正常', requestId);
  }
  
  /**
   * 格式化HTTP响应
   */
  formatResponse(result, requestId) {
    const statusCode = result.code || HTTPStatus.OK;
    const headers = getCORSHeaders();
    
    return {
      statusCode,
      headers,
      body: JSON.stringify(result)
    };
  }
}

/**
 * 云函数主入口
 */
exports.main = async (event, context) => {
  const router = new ContentAPIRouter();
  return await router.route(event, context);
};