<template>
  <div class="voice-chat-container">
    <!-- 语音聊天界面 -->
    <div v-if="showVoiceChat" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <!-- 头部 -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold">🎙️ 语音聊天</h2>
              <p class="text-blue-100 mt-1">与AI助手进行实时语音对话</p>
            </div>
            <button 
              @click="closeVoiceChat"
              class="btn btn-circle btn-ghost text-white hover:bg-white hover:bg-opacity-20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 连接状态 -->
        <div class="p-4 border-b">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div 
                :class="[
                  'w-3 h-3 rounded-full',
                  connectionStatus.type === 'connected' ? 'bg-green-500' : 
                  connectionStatus.type === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                ]"
              ></div>
              <span class="font-medium" :class="getStatusTextColor()">
                {{ connectionStatus.message }}
              </span>
            </div>
            
            <!-- 连接控制按钮 -->
            <div class="flex gap-2">
              <!-- 初始连接按钮 -->
              <button 
                v-if="!isConnected && !isConnecting && connectionStatus.type === 'disconnected' && !errorMessage"
                @click="connectToAgent"
                class="btn btn-primary btn-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                连接
              </button>
              <!-- 连接失败时显示重试按钮 -->
              <button 
                v-if="!isConnected && !isConnecting && connectionStatus.type === 'disconnected' && errorMessage"
                @click="connectToAgent"
                class="btn btn-primary btn-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重试连接
              </button>
              <!-- 连接中显示取消按钮 -->
              <button 
                v-if="isConnecting"
                @click="cancelConnection"
                class="btn btn-warning btn-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                取消连接
              </button>
              <!-- 已连接时显示断开按钮 -->
              <button 
                v-if="isConnected"
                @click="disconnectFromAgent"
                class="btn btn-error btn-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                断开连接
              </button>
            </div>
          </div>
        </div>

        <!-- 音频可视化器 -->
        <div class="p-4 border-b">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center justify-center gap-1 h-12" ref="visualizerRef">
              <div 
                v-for="i in 20" 
                :key="i"
                class="w-1 bg-blue-500 rounded-full transition-all duration-100"
                :style="{ height: visualizerBars[i - 1] || '8px' }"
              ></div>
            </div>
            <div class="text-center text-sm text-gray-500 mt-2">
              {{ isConnected ? (isMuted ? '🔇 已静音' : '🎤 正在监听...') : '⏸️ 未连接' }}
            </div>
          </div>
        </div>

        <!-- 对话记录 -->
        <div class="flex-1 p-4 max-h-80 overflow-y-auto" ref="chatContainer">
          <div class="space-y-3">
            <div v-if="messages.length === 0" class="text-center text-gray-500 py-8">
              <div class="text-4xl mb-2">💬</div>
              <p>开始对话后，这里将显示语音识别和AI回复的文字内容</p>
            </div>
            
            <div 
              v-for="(message, index) in messages" 
              :key="index"
              class="flex"
              :class="message.type === 'user' ? 'justify-end' : message.type === 'system' ? 'justify-center' : 'justify-start'"
            >
              <div 
                class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm"
                :class="getMessageClass(message.type)"
              >
                <div class="text-sm">{{ message.content }}</div>
                <div class="text-xs opacity-70 mt-1">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="p-4 border-t bg-gray-50">
          <div class="flex justify-center gap-3">
            <button 
              @click="toggleMute"
              :disabled="!isConnected"
              class="btn btn-circle"
              :class="isMuted ? 'btn-warning' : 'btn-primary'"
            >
              <svg v-if="!isMuted" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            </button>
            
            <button 
              @click="clearMessages"
              :disabled="!isConnected || messages.length === 0"
              class="btn btn-circle btn-ghost"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          
          <div class="text-center text-xs text-gray-500 mt-3">
            快捷键：空格键切换静音 | Esc键断开连接
          </div>
        </div>

        <!-- 错误提示 -->
        <div v-if="errorMessage" class="p-4 border-t">
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import VoiceChat from '../utils/voiceChat.js'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  inputUrl: {
    type: String,
    default: ''
  },
  isPlayerPlaying: {  // 新增prop用于接收播放器状态
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close'])

// 响应式数据
const showVoiceChat = ref(props.visible)
const isConnected = ref(false)
const isConnecting = ref(false)
const isMuted = ref(false)
const errorMessage = ref('')

// 连接状态
const connectionStatus = reactive({
  message: '未连接',
  type: 'disconnected' // disconnected, connecting, connected
})

// 消息列表
const messages = ref([])

// 音频可视化
const visualizerBars = ref(Array(20).fill('8px'))
const visualizerRef = ref(null)
const chatContainer = ref(null)

// 语音聊天实例
let voiceChatInstance = null
let audioContext = null
let analyser = null
let animationId = null

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  showVoiceChat.value = newVal
  if (newVal) {
    // 如果播放器正在播放，则暂停播放
    if (props.isPlayerPlaying && window.parentAudioPlayer) {
      window.parentAudioPlayer.pause()
    }
    
    initVoiceChat()
    // 自动连接
    nextTick(() => {
      connectToAgent()
    })
  } else {
    cleanup()
  }
})

// 在组件挂载时检查是否需要暂停播放器
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  if (props.visible) {
    // 如果播放器正在播放，则暂停播放
    if (props.isPlayerPlaying && window.parentAudioPlayer) {
      window.parentAudioPlayer.pause()
    }
    
    initVoiceChat()
    // 自动连接
    nextTick(() => {
      connectToAgent()
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  cleanup()
})

/**
 * 初始化语音聊天
 */
const initVoiceChat = () => {
  if (!voiceChatInstance) {
    voiceChatInstance = new VoiceChat()
    
    // 设置回调函数
    voiceChatInstance.setCallbacks({
      onStatusChange: handleStatusChange,
      onMessageReceived: handleMessageReceived,
      onError: handleError,
      onLog: handleLog
    })
  }
}

/**
 * 处理状态变化
 */
const handleStatusChange = (status, type) => {
  connectionStatus.message = status
  connectionStatus.type = type
  
  isConnected.value = type === 'connected'
  isConnecting.value = type === 'connecting'
}

/**
 * 处理接收到的消息
 */
const handleMessageReceived = (content, type, timestamp) => {
  messages.value.push({
    content,
    type,
    timestamp
  })
  
  // 滚动到底部
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}

/**
 * 处理错误
 */
const handleError = (error) => {
  errorMessage.value = error
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

/**
 * 处理日志
 */
const handleLog = (message, type) => {
  console.log(`[VoiceChat UI] ${message}`)
}

/**
 * 连接到Agent
 */
const connectToAgent = async () => {
  if (!voiceChatInstance) return
  
  errorMessage.value = ''
  const success = await voiceChatInstance.connectAgent()
  
  if (success) {
    startAudioVisualization()
  }
}

/**
 * 取消连接
 */
const cancelConnection = async () => {
  if (!voiceChatInstance) return
  
  await voiceChatInstance.cancelConnection()
  
  // 更新UI状态：取消连接后应该显示连接按钮
  isConnecting.value = false
  isConnected.value = false
  connectionStatus.message = '连接已取消'
  connectionStatus.type = 'disconnected'
  
  // 停止音频可视化
  stopAudioVisualization()
}

/**
 * 断开连接
 */
const disconnectFromAgent = async () => {
  if (!voiceChatInstance) return
  
  await voiceChatInstance.disconnectAgent()
  stopAudioVisualization()
}

/**
 * 切换静音
 */
const toggleMute = () => {
  if (!voiceChatInstance) return
  
  const muted = voiceChatInstance.toggleMute()
  isMuted.value = muted
}

/**
 * 清空消息
 */
const clearMessages = () => {
  messages.value = []
  handleMessageReceived('对话记录已清空，开始新的对话吧！', 'system', Date.now())
}

/**
 * 关闭语音聊天
 */
const closeVoiceChat = () => {
  emit('close')
}

/**
 * 获取状态文字颜色
 */
const getStatusTextColor = () => {
  switch (connectionStatus.type) {
    case 'connected':
      return 'text-green-600'
    case 'connecting':
      return 'text-yellow-600'
    default:
      return 'text-red-600'
  }
}

/**
 * 获取消息样式类
 */
const getMessageClass = (type) => {
  switch (type) {
    case 'user':
      return 'bg-blue-500 text-white ml-auto'
    case 'agent':
      return 'bg-gray-200 text-gray-800'
    case 'system':
      return 'bg-yellow-100 text-yellow-800 text-center'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

/**
 * 格式化时间
 */
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 启动音频可视化
 */
const startAudioVisualization = () => {
  if (!voiceChatInstance) return
  
  const audioTrack = voiceChatInstance.getAudioVisualizationData()
  if (!audioTrack) {
    // 如果无法获取真实音频数据，使用模拟可视化
    startSimulatedVisualization()
    return
  }
  
  try {
    audioContext = new AudioContext()
    const mediaStream = new MediaStream([audioTrack])
    const source = audioContext.createMediaStreamSource(mediaStream)
    analyser = audioContext.createAnalyser()
    
    analyser.fftSize = 256
    source.connect(analyser)
    
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    
    const updateVisual = () => {
      if (!isConnected.value) return
      
      analyser.getByteFrequencyData(dataArray)
      
      // 将频率数据转换为可视化条
      const step = Math.floor(dataArray.length / 20)
      const newBars = []
      
      for (let i = 0; i < 20; i++) {
        const value = dataArray[i * step] || 0
        const height = Math.max(8, (value / 255) * 40)
        newBars.push(`${height}px`)
      }
      
      visualizerBars.value = newBars
      animationId = requestAnimationFrame(updateVisual)
    }
    
    updateVisual()
  } catch (error) {
    console.error('音频可视化启动失败:', error)
    startSimulatedVisualization()
  }
}

/**
 * 启动模拟可视化
 */
const startSimulatedVisualization = () => {
  const interval = setInterval(() => {
    if (!isConnected.value) {
      clearInterval(interval)
      return
    }
    
    const newBars = []
    for (let i = 0; i < 20; i++) {
      const height = 8 + Math.random() * 32
      newBars.push(`${height}px`)
    }
    visualizerBars.value = newBars
  }, 100)
}

/**
 * 停止音频可视化
 */
const stopAudioVisualization = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  
  // 重置可视化条
  visualizerBars.value = Array(20).fill('8px')
}

/**
 * 键盘事件处理
 */
const handleKeydown = (e) => {
  if (!showVoiceChat.value) return
  
  if (e.key === ' ' && isConnected.value) {
    e.preventDefault()
    toggleMute()
  } else if (e.key === 'Escape') {
    if (isConnected.value) {
      disconnectFromAgent()
    } else {
      closeVoiceChat()
    }
  }
}

/**
 * 清理资源
 */
const cleanup = () => {
  if (voiceChatInstance) {
    voiceChatInstance.cleanup()
  }
  stopAudioVisualization()
  messages.value = []
  isConnected.value = false
  isConnecting.value = false
  isMuted.value = false
  errorMessage.value = ''
  connectionStatus.message = '未连接'
  connectionStatus.type = 'disconnected'
}

</script>

<style scoped>
.voice-chat-container {
  /* 确保组件样式不会影响其他部分 */
}

/* 自定义滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 消息动画 */
.space-y-3 > * {
  animation: messageSlideIn 0.3s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>