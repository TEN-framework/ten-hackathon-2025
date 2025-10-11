<template>
  <div class="hero min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold text-gray-800 mb-8">讲我听听</h1>
        <p class="text-xl text-gray-600 mb-8">
          懒得看字，就讲我听听~
        </p>
        
        <!-- 云开发状态提示 -->
        <div v-if="!cloudbaseStatus.connected" class="alert alert-warning mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>云开发环境未连接，部分功能可能受限</span>
        </div>
        
        <!-- URL输入区域 -->
        <div class="card bg-white shadow-xl mb-6">
          <div class="card-body">
            <h2 class="card-title justify-center text-gray-700">请输入网页链接</h2>
            <div class="flex gap-2 mt-4">
              <div class="relative flex-1">
                <input 
                  type="text" 
                  v-model="inputUrl"
                  placeholder="https://example.com"
                  class="input input-bordered w-full pr-10"
                  :class="{
                    'input-success': urlValidation.level === 'success',
                    'input-warning': urlValidation.level === 'warning',
                    'input-error': urlValidation.level === 'error'
                  }"
                  @input="handleUrlInput"
                />
                <!-- 清空按钮 -->
                <button 
                  v-if="inputUrl"
                  @click="clearUrlInput"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              <button 
                class="btn btn-primary"
                @click="pasteFromClipboard"
              >
                粘贴
              </button>
            </div>
            <!-- URL验证状态显示 -->
            <div v-if="urlValidation.message" 
                 :class="[
                   'text-sm mt-2 transition-all duration-300',
                   urlValidation.level === 'success' ? 'text-success' : '',
                   urlValidation.level === 'warning' ? 'text-warning' : '',
                   urlValidation.level === 'error' ? 'text-error' : '',
                   urlValidation.level === 'info' ? 'text-info' : ''
                 ]">
              <div class="flex items-center gap-1">
                <span v-if="urlValidation.level === 'success'" class="text-green-500">✓</span>
                <span v-if="urlValidation.level === 'warning'" class="text-yellow-500">⚠</span>
                <span v-if="urlValidation.level === 'error'" class="text-red-500">✗</span>
                <span v-if="urlValidation.level === 'info'" class="text-blue-500">ℹ</span>
                {{ urlValidation.message }}
              </div>
            </div>
          </div>
        </div>

        <!-- 功能按钮区域 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <button 
            class="btn btn-primary"
            @click="handleOriginalRead"
            :disabled="!urlValidation.isValid || isLoading || (isPlaying && currentPlaylistType === 'original')"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
            {{ isLoading ? '处理中...' : '原文朗读' }}
          </button>
          <button 
            class="btn btn-secondary"
            @click="handlePodcast"
            :disabled="!urlValidation.isValid || isLoading || (isPlaying && currentPlaylistType === 'podcast')"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
            {{ isLoading ? '请稍后...' : '双人播客' }}
          </button>
          <button 
            class="btn btn-accent"
            @click="handleChat"
            :disabled="isLoading"
          >
            跟我聊聊
          </button>
        </div>

        <!-- 音频播放器 -->
        <AudioPlayer 
          ref="audioPlayer"
          v-if="showAudioPlayer"
          @playback-completed="handlePlaybackCompleted"
        />

        <!-- 错误信息显示 -->
        <div v-if="errorMessage" class="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- v0.8 移除标题和内容等显示逻辑（保留占位注释，避免大块删除造成冲突）
        <div v-if="false && extractedData" class="card bg-white shadow-xl mt-6">
          <div class="card-body">
            <h2 class="card-title text-gray-700 mb-4">抓取结果</h2>
            
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">标题：</h3>
              <p class="text-gray-700 bg-gray-50 p-3 rounded">{{ extractedData.title }}</p>
            </div>
            
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-800 mb-2">内容：</h3>
              <div class="text-gray-700 bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
                <pre class="whitespace-pre-wrap font-sans">{{ extractedData.content }}</pre>
              </div>
            </div>
            
            <div v-if="extractedData.podcast" class="mt-6 border-t pt-4">
              <h3 class="text-lg font-semibold text-green-700 mb-3">🎙️ 播客稿生成结果</h3>
              
              <div class="mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-2">播客标题：</h4>
                <p class="text-gray-700 bg-green-50 p-3 rounded border border-green-200">
                  {{ extractedData.podcast.title }}
                </p>
              </div>
              
              <div class="mb-4">
                <h4 class="text-md font-medium text-gray-800 mb-2">对话内容：</h4>
                <div class="bg-green-50 p-3 rounded border border-green-200 max-h-96 overflow-y-auto">
                  <div v-for="(dialogue, index) in extractedData.podcast.content" 
                       :key="index" 
                       class="mb-3 last:mb-0">
                    <div class="flex items-start gap-3">
                      <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium"
                            :class="index % 2 === 0 ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'">
                        {{ index % 2 === 0 ? '👨' : '👩' }}
                      </span>
                      <p class="text-gray-700 flex-1">{{ dialogue }}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="text-xs text-green-600 mt-2">
                <p>✅ 播客稿已生成，共 {{ extractedData.podcast.content.length }} 段对话</p>
              </div>
            </div>
            
            <div class="text-sm text-gray-500 border-t pt-3">
              <p>来源：{{ extractedData.url }}</p>
              <p>抓取时间：{{ new Date(extractedData.timestamp).toLocaleString('zh-CN') }}</p>
            </div>
          </div>
        </div>
        -->
      </div>
    </div>

    <!-- 语音聊天组件 -->
    <VoiceChat 
      :visible="showVoiceChat"
      :inputUrl="inputUrl"
      :isPlayerPlaying="isPlaying"
      @close="closeVoiceChat"
    />
  </div>
</template>

<script setup>

import { ref, onMounted, watch, onUnmounted } from 'vue'
import { ensureLogin, checkEnvironment, isValidEnvId, ENV_ID, app } from '../utils/cloudbase.js'
// 替换为新架构API客户端
import { extractContent, generatePodcast, generateTTS, getContent, healthCheck, withErrorHandling } from '../utils/new-api-client.js'
import { saveAudioRecord } from '../utils/database.js' // 保留音频记录保存，因为新API暂不支持
import { generateWelcomeSpeech, downloadAudio } from '../utils/tts-client.js'
import { uploadAudioFile } from '../utils/storage.js'
import { validateUrlInRealTime, isValidUrl, normalizeUrl } from '../utils/url-validator.js'
import VoiceChat from '../components/VoiceChat.vue'
import AudioPlayer from '../components/AudioPlayer.vue'


// 响应式数据
const isLoading = ref(false)
const isPlaying = ref(false)  // 添加这行来跟踪播放状态
const inputUrl = ref('')
const extractedData = ref(null)
// v0.8：仅持有 contentId 以驱动后续 TTS/Poll 流程
const contentId = ref(null)
const errorMessage = ref('')
const cloudbaseStatus = ref({
  connected: false,
  envId: isValidEnvId ? ENV_ID : null
})
const loginState = ref({
  user: null
})

// URL验证相关
const urlValidation = ref({
  isValid: false,
  message: '',
  level: 'info' // info, success, warning, error
})

// 语音聊天相关
const showVoiceChat = ref(false)

// 音频播放器相关
const showAudioPlayer = ref(false)
const audioPlayer = ref(null)

// 播放列表类型（新增）
const currentPlaylistType = ref(null)

// 在组件挂载时设置全局音频播放器引用
onMounted(() => {
  // 设置全局音频播放器引用，供VoiceChat组件使用
  window.parentAudioPlayer = audioPlayer.value
})

// 在组件卸载时清理全局引用
onUnmounted(() => {
  if (typeof window.parentAudioPlayer !== 'undefined') {
    delete window.parentAudioPlayer
  }
})

// URL输入处理
const handleUrlInput = async () => {
  // 实时验证URL
  const validation = validateUrlInRealTime(inputUrl.value)
  urlValidation.value = validation
  
  // 强制触发按钮状态更新
  forceUpdateButtonState()
  
  // 如果URL验证通过，自动调用Python云函数提取内容（v0.1.2功能）
  if (validation.isValid && inputUrl.value.trim()) {
    console.log('URL验证通过，开始自动提取内容...')
    // 更新状态为"链接内容提取中。。。"
    urlValidation.value = {
      isValid: true,
      message: '链接内容提取中。。。',
      level: 'info'
    }
    // 强制触发按钮状态更新
    forceUpdateButtonState()
    await autoExtractContent()
  }
}

// 监听URL输入变化，实现实时验证
watch(inputUrl, (newUrl, oldUrl) => {
  if (newUrl.trim()) {
    handleUrlInput()
  } else {
    // 清空时重置验证状态
    urlValidation.value = {
      isValid: false,
      message: '',
      level: 'info'
    }
    // 强制触发按钮状态更新
    forceUpdateButtonState()
  }
})

// 从剪贴板粘贴
const pasteFromClipboard = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputUrl.value = text
    // 粘贴后立即验证
    handleUrlInput()
  } catch (error) {
    console.error('粘贴失败:', error)
  }
}

// 清空URL输入
const clearUrlInput = () => {
  inputUrl.value = ''
  urlValidation.value = {
    isValid: false,
    message: '',
    level: 'info'
  }
  // 强制触发按钮状态更新
  forceUpdateButtonState()
}

// 强制更新按钮状态的函数，确保每次验证URL均触发启用或禁用按钮
const forceUpdateButtonState = () => {
  // 触发Vue的响应式更新
  nextTick(() => {
    // 强制触发组件更新以确保按钮状态正确
    console.log('强制更新按钮状态:', urlValidation.value.isValid)
  })
}

// 显示保存状态
const showSaveStatus = (success, message) => {
  // 移除此函数的实现，因为我们不再显示数据库操作提示
}

// 生成并播放欢迎语音
const generateAndPlayWelcomeAudio = async (originalUrl = '', relatedContentId = '') => {
  try {
    console.log('开始生成欢迎语音...')
    
    // 显示音频播放器
    showAudioPlayer.value = true
    
    // 设置音频播放器为加载状态
    if (audioPlayer.value) {
      audioPlayer.value.setAudioInfo({
        text: '你好，讲我听听',
        voice: 'Cherry',
        language: 'Chinese'
      })
    }
    
    // 调用TTS服务生成语音
    const ttsResult = await generateWelcomeSpeech()
    
    if (!ttsResult.success) {
      throw new Error(ttsResult.error || 'TTS服务调用失败')
    }
    
    console.log('TTS合成成功，音频URL:', ttsResult.audioUrl)
    
    // 下载音频文件
    const audioBlob = await downloadAudio(ttsResult.audioUrl)
    console.log('音频文件下载成功，大小:', audioBlob.size)
    
    // 上传音频文件到云存储
    const uploadResult = await uploadAudioFile(audioBlob, 'welcome_audio')
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || '音频文件上传失败')
    }
    
    console.log('音频文件上传成功:', uploadResult.downloadUrl)
    
    // 保存音频记录到数据库
    const saveData = {
      fileID: uploadResult.fileID,
      downloadUrl: uploadResult.downloadUrl,
      cloudPath: uploadResult.cloudPath,
      fileName: uploadResult.fileName,
      text: '你好，讲我听听',
      voice: 'Cherry',
      language: 'Chinese',
      originalUrl: originalUrl,
      relatedContentId: relatedContentId
    }
    
    const saveResult = await saveAudioRecord(saveData)
    
    if (!saveResult.success) {
      console.warn('音频记录保存失败:', saveResult.error)
      // 继续播放，但不影响用户体验
    } else {
      console.log('音频记录保存成功')
    }
    
    // 设置音频播放器URL并播放
    if (audioPlayer.value) {
      audioPlayer.value.setAudioUrl(uploadResult.downloadUrl)
      audioPlayer.value.setAudioInfo({
        text: '你好，讲我听听',
        voice: 'Cherry',
        language: 'Chinese',
        fileSize: audioBlob.size
      })
      
      // 延迟播放，确保音频加载完成
      setTimeout(() => {
        if (audioPlayer.value) {
          audioPlayer.value.play()
        }
      }, 500)
    }
    
    return {
      success: true,
      audioUrl: uploadResult.downloadUrl,
      fileID: uploadResult.fileID
    }
    
  } catch (error) {
    console.error('生成欢迎语音失败:', error)
    
    // 隐藏音频播放器
    showAudioPlayer.value = false
    
    return {
      success: false,
      error: error.message
    }
  }
}

// 自动提取内容（v0.1.2功能：URL有效性检测通过后直接调用Python云函数）
const autoExtractContent = async () => {
  // 如果已经在加载中，避免重复调用
  if (isLoading.value) {
    return
  }

  // 规范化URL
  const normalizedUrl = normalizeUrl(inputUrl.value)
  
  isLoading.value = true
  errorMessage.value = ''
  extractedData.value = null

  
  try {
    console.log('开始v0.8自动提取网页内容:', normalizedUrl)
    
    // 确保用户已登录
    const state = await ensureLogin()
    loginState.value = state
    console.log('用户登录状态:', state)
    
    // 使用新架构API提取内容
    console.log('调用新架构API提取内容:', normalizedUrl)
    
    const extractResult = await extractContent(normalizedUrl, { 
      autoSave: true, // 启用自动保存
      processAudio: false // 不自动处理音频
    })
    
    if (!extractResult.success) {
      throw new Error(extractResult.message || '网页内容抓取失败')
    }
    
    console.log('新架构API内容提取成功:', extractResult.data)
    
    // v0.8：不再展示标题/正文，仅记录 contentId 与来源URL
    contentId.value = extractResult?.data?.id || extractResult?.data?._id || null
    extractedData.value = {
      id: contentId.value,
      url: extractResult?.data?.url || normalizedUrl,
      timestamp: extractResult?.data?.timestamp || Date.now()
    }
    
    // 显示网页标题而不是数据库操作提示
    urlValidation.value = {
      isValid: true,
      message: extractResult?.data?.title || '内容提取成功',
      level: 'success'
    }
    
    // 移除保存状态显示
    // showSaveStatus(true, '✅ 内容已通过新API保存到数据库')
    
  } catch (error) {
    console.error('自动提取内容失败:', error)
    errorMessage.value = '自动提取内容失败: ' + error.message
    // 更新URL验证状态为错误
    urlValidation.value = {
      isValid: false,
      message: '内容提取失败: ' + error.message,
      level: 'error'
    }
  } finally {
    isLoading.value = false
  }
}

// 处理原文朗读
/**
 * v0.8 原文朗读流程
 * 1) 确保已有 contentId（无则先 extract）
 * 2) 调 /tts/generate audio_type=original
 * 3) 展示等待并轮询 ttsc_task，完成后获取 ttsc_url 列表并播放
 */
const handleOriginalRead = async () => {
  // 每次触发都重新验证URL
  const validation = validateUrlInRealTime(inputUrl.value)
  urlValidation.value = validation
  forceUpdateButtonState()
  
  // 先进行URL验证检查
  if (!urlValidation.value.isValid) {
    errorMessage.value = urlValidation.value.message || '请输入有效的网页链接'
    return
  }

  // 规范化URL
  const normalizedUrl = normalizeUrl(inputUrl.value)
  
  isLoading.value = true
  errorMessage.value = ''
  // v0.8：显示播放器并进入加载态
  showAudioPlayer.value = true
  if (audioPlayer.value?.setLoading) audioPlayer.value.setLoading(true)

  
  try {
    // 确保用户已登录
    const state = await ensureLogin()
    loginState.value = state
    console.log('用户登录状态:', state)
    // 确保已有 contentId（若无则先提取）
    if (!contentId.value) {
      await autoExtractContent()
      if (!contentId.value) {
        throw new Error('内容提取失败，无法生成原文朗读')
      }
    }
    // 触发 TTS 生成（原文）
    const ttsGen = await generateTTS(contentId.value, 'original')
    if (!ttsGen.success) {
      throw new Error(ttsGen.message || '原文 TTS 生成请求失败')
    }
    // 轮询 ttsc_task 状态并获取 ttsc_url 列表
    const urls = await pollTTSAndGetUrls(contentId.value, 'original')
    // 将播放列表交给播放器
    if (audioPlayer.value?.setPlaylist) {
      audioPlayer.value.setPlaylist(urls, 'original') // 设置播放列表类型为'original'
      currentPlaylistType.value = 'original' // 更新当前播放列表类型
      if (audioPlayer.value?.setLoading) audioPlayer.value.setLoading(false)
      // 自动播放第一段
      setTimeout(() => {
        if (audioPlayer.value) {
          isPlaying.value = true  // 设置播放状态为true
          audioPlayer.value.play()
        }
      }, 200)
    }
    
  } catch (error) {
    console.error('原文朗读失败:', error)
    errorMessage.value = '原文朗读失败: ' + error.message
  } finally {
    isLoading.value = false
    if (audioPlayer.value?.setLoading) audioPlayer.value.setLoading(false)
  }
}

// 处理双人播客
/**
 * v0.8 双人播客流程
 * 1) 确保已有 contentId（无则先 extract）
 * 2) 生成播客稿 /podcast
 * 3) /tts/generate audio_type=podcast
 * 4) 轮询 ttsp_task 完成后获取 ttsp_url 列表并播放
 */
const handlePodcast = async () => {
  // 每次触发都重新验证URL
  const validation = validateUrlInRealTime(inputUrl.value)
  urlValidation.value = validation
  forceUpdateButtonState()
  
  // 先进行URL验证检查
  if (!urlValidation.value.isValid) {
    errorMessage.value = urlValidation.value.message || '请输入有效的网页链接'
    return
  }

  // 规范化URL
  const normalizedUrl = normalizeUrl(inputUrl.value)
  
  isLoading.value = true
  errorMessage.value = ''
  // v0.8：显示播放器并进入加载态
  showAudioPlayer.value = true
  if (audioPlayer.value?.setLoading) audioPlayer.value.setLoading(true)
  
  try {
    // 确保用户已登录
    const state = await ensureLogin()
    loginState.value = state
    console.log('用户登录状态:', state)
    
    // 确保已有 contentId（若无则先提取）
    if (!contentId.value) {
      await autoExtractContent()
      if (!contentId.value) {
        throw new Error('内容提取失败，无法生成播客')
      }
    }
    // 生成播客稿
    const podcastResult = await generatePodcast(contentId.value, '科普风格')
    if (!podcastResult.success) {
      throw new Error(podcastResult.message || '播客稿生成失败')
    }
    // 触发 TTS 生成（播客）
    const ttsGen = await generateTTS(contentId.value, 'podcast')
    if (!ttsGen.success) {
      throw new Error(ttsGen.message || '播客 TTS 生成请求失败')
    }
    // 轮询 ttsp_task 并获取 ttsp_url 列表
    const urls = await pollTTSAndGetUrls(contentId.value, 'podcast')
    if (audioPlayer.value?.setPlaylist) {
      audioPlayer.value.setPlaylist(urls, 'podcast') // 设置播放列表类型为'podcast'
      currentPlaylistType.value = 'podcast' // 更新当前播放列表类型
      if (audioPlayer.value?.setLoading) audioPlayer.value.setLoading(false)
      setTimeout(() => {
        if (audioPlayer.value) {
          isPlaying.value = true  // 设置播放状态为true
          audioPlayer.value.play()
        }
      }, 1000)
    }
    
  } catch (error) {
    console.error('生成播客稿失败:', error)
    errorMessage.value = error.message || '生成播客稿失败，请稍后重试'
  } finally {
    isLoading.value = false
    if (audioPlayer.value?.setLoading) audioPlayer.value.setLoading(false)
  }
}

// 处理跟我聊聊
const handleChat = () => {
  console.log('跟我聊聊:', inputUrl.value)
  // 暂停播放器
  if (audioPlayer.value) {
    audioPlayer.value.pause()
  }
  showVoiceChat.value = true
}

// 关闭语音聊天
const closeVoiceChat = () => {
  showVoiceChat.value = false
}

// 测试新架构API连接
const testCloudbaseConnection = async () => {
  isLoading.value = true
  try {
    const state = await ensureLogin()
    loginState.value = state
    
    // 测试新架构API健康状态
    const healthResult = await healthCheck()
    if (healthResult.success) {
      cloudbaseStatus.value.connected = true
      console.log('新架构API连接测试成功！', healthResult.data)
    } else {
      console.warn('新架构API连接测试失败:', healthResult.message)
      cloudbaseStatus.value.connected = false
    }
    
    // 显示成功消息
    console.log('云开发新架构连接测试完成！')
  } catch (error) {
    console.error('云开发连接测试失败:', error)
    cloudbaseStatus.value.connected = false
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时检查云开发状态
/**
 * v0.8 轮询 TTS 状态并返回播放URL数组
 * @param {string} id - 内容ID
 * @param {'original'|'podcast'} type - 音频类型
 * @returns {Promise<string[]>} 可播放的下载URL列表
 */
const pollTTSAndGetUrls = async (id, type) => {
  // 轮询参数
  const maxAttempts = 30         // 最多轮询 30 次
  const intervalMs = 10000        // 每 10 秒轮询一次
  let attempts = 0

  // 根据类型映射任务字段与URL字段
  const taskKey = type === 'original' ? 'ttsc_task' : 'ttsp_task'
  const urlKey = type === 'original' ? 'ttsc_url' : 'ttsp_url'

  return new Promise((resolve, reject) => {
    const tick = async () => {
      attempts++
      try {
        const res = await getContent(id)
        if (!res.success) {
          throw new Error(res.message || '内容查询失败')
        }
        const data = res.data || {}
        const task = data[taskKey] || {}
        const status = task.status || data.status
        if (status === 'completed') {
          const list = Array.isArray(data[urlKey]) ? data[urlKey] : []
          // 提取下载URL（若无 download_url，可回退 cloud_path 签发；此处优先 download_url）
          const urls = list
            .map(it => it?.download_url || it?.url)
            .filter(Boolean)
          if (urls.length === 0) {
            reject(new Error('未获取到音频URL'))
          } else {
            resolve(urls)
          }
          return
        }
        if (attempts >= maxAttempts) {
          reject(new Error('等待音频生成超时'))
          return
        }
        setTimeout(tick, intervalMs)
      } catch (err) {
        if (attempts >= maxAttempts) {
          reject(err)
          return
        }
        setTimeout(tick, intervalMs)
      }
    }
    tick()
  })
}

// 处理播放完成事件
const handlePlaybackCompleted = () => {
  isPlaying.value = false  // 设置播放状态为false
  currentPlaylistType.value = null // 重置播放列表类型
  // 强制更新按钮状态
  forceUpdateButtonState()
}

// 重播功能
const replayAudio = () => {
  if (audioPlayer.value) {
    isPlaying.value = true  // 设置播放状态为true
    audioPlayer.value.replay()
    // 强制更新按钮状态
    forceUpdateButtonState()
  }
}

onMounted(async () => {
  // 检查环境配置
  const envValid = checkEnvironment()
  cloudbaseStatus.value.connected = envValid
  
  if (envValid) {
    // 尝试获取登录状态
    try {
      const state = await ensureLogin()
      loginState.value = state
      
      // 测试新架构API连接
      await testCloudbaseConnection()
    } catch (error) {
      console.warn('初始化登录状态失败:', error)
    }
  }
})
</script>