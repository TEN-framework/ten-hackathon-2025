<template>
  <div class="audio-player-container">
    <!-- 音频播放器 -->
    <div v-if="audioUrl && !isLoading" class="card bg-white shadow-lg mt-6">
      <div class="card-body">
        <!-- 去掉标题和图标 -->
        
        <!-- 音频播放器 -->
        <div class="space-y-4">
          <!-- 简化后的音频控制 -->
          <div class="flex items-center justify-center space-x-8">
            <!-- 播放/暂停按钮 -->
            <button 
              @click="isPlaybackCompleted ? replay() : togglePlay()" 
              class="btn btn-circle btn-primary"
              :disabled="!audioUrl"
            >
              <svg v-if="isPlaybackCompleted" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <svg v-else-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <!-- 美化后的音量控制 -->
            <div class="flex items-center space-x-3">
              <button 
                @click="toggleMute" 
                class="btn btn-ghost btn-circle btn-sm hover:bg-gray-100 transition-colors duration-200"
                :class="{ 'text-blue-500': !isMuted, 'text-gray-400': isMuted }"
              >
                <!-- 使用IconPark的音量图标 -->
                <VolumeNotice v-if="!isMuted" theme="outline" size="24" fill="#333" />
                <!-- 使用IconPark的静音图标 -->
                <VolumeMute v-else theme="outline" size="24" :fill="isMuted ? '#9ca3af' : '#333'" />
              </button>
              <!-- 美化后的音量滑块 -->
              <div class="relative w-24">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  v-model="volume" 
                  class="range range-primary range-sm w-full"
                  @input="updateVolume"
                >
              </div>
            </div>
          </div>
          
          <!-- 音频状态 -->
          <div class="text-center mt-2">
            <span class="text-sm" :class="isPlaying ? 'text-green-600' : 'text-gray-500'">
              {{ getPlayStatusText() }}
            </span>
          </div>
        </div>
        
        <!-- 错误信息 -->
        <div v-if="errorMessage" class="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { VolumeMute, VolumeNotice } from '@icon-park/vue-next'

// 声明props
const props = defineProps({
  playlistType: {
    type: String,
    default: null
  }
})

// 声明事件发射器
const emit = defineEmits(['playbackCompleted', 'play-state-changed'])

// 响应式数据
const audioUrl = ref('')
// 播放列表与索引
const playlist = ref([])           // string[]: 音频URL列表
const playlistType = ref(null)     // 播放列表类型 ('original' | 'podcast' | null)
const currentIndex = ref(-1)       // 当前播放索引，-1 表示未初始化
const audioElement = ref(null)
const isPlaying = ref(false)
const isMuted = ref(false)
const volume = ref(0.7)
const currentTime = ref(0)
const duration = ref(0)
const progressPercentage = ref(0)
const isLoading = ref(false)
const errorMessage = ref('')
const isPlaybackCompleted = ref(false)  // 添加播放完成状态

// 音频信息
const audioInfo = ref({
  text: '',
  voice: '',
  language: '',
  fileSize: 0
})

// 监听音频URL变化
watch(audioUrl, (newUrl) => {
  if (newUrl) {
    loadAudio(newUrl)
  }
})

// 组件挂载时创建音频元素
onMounted(() => {
  audioElement.value = new Audio()
  setupAudioListeners()
})

// 组件卸载时清理资源
onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value = null
  }
})

// 设置音频事件监听器
const setupAudioListeners = () => {
  if (!audioElement.value) return
  
  audioElement.value.addEventListener('loadedmetadata', () => {
    duration.value = audioElement.value.duration
    // 不再设置isLoading为false，以避免播放切换时的闪烁
  })
  
  audioElement.value.addEventListener('canplay', () => {
    // 当音频可以播放时，隐藏加载状态
    isLoading.value = false
  })
  
  audioElement.value.addEventListener('timeupdate', () => {
    currentTime.value = audioElement.value.currentTime
    progressPercentage.value = (currentTime.value / duration.value) * 100
  })
  
  audioElement.value.addEventListener('play', () => {
    isPlaying.value = true
    emit('play-state-changed', true)
  })
  
  audioElement.value.addEventListener('pause', () => {
    isPlaying.value = false
    emit('play-state-changed', false)
  })
  
  audioElement.value.addEventListener('ended', () => {
    isPlaying.value = false
    currentTime.value = 0
    progressPercentage.value = 0
    // v0.8: 自动连续播放下一段
    if (playlist.value.length > 0 && currentIndex.value >= 0) {
      const nextIndex = currentIndex.value + 1
      if (nextIndex < playlist.value.length) {
        currentIndex.value = nextIndex
        setAudioUrl(playlist.value[currentIndex.value])
        // 自动播放下一段，不显示加载状态
        setTimeout(() => {
          if (audioElement.value) {
            audioElement.value.play().catch(err => {
              console.error('自动播放下一音频失败:', err)
              errorMessage.value = '自动播放下一音频失败: ' + (err.message || '未知错误')
            })
          }
        }, 100)
      } else {
        // 播放列表播放完毕
        isPlaybackCompleted.value = true
        emit('playbackCompleted')  // 通知父组件播放完成
      }
    }
  })
  
  audioElement.value.addEventListener('error', (e) => {
    console.error('音频播放错误:', e)
    errorMessage.value = '音频播放失败，请检查网络连接'
    isLoading.value = false
  })
}

// 加载音频
const loadAudio = (url) => {
  if (!audioElement.value) return
  
  // 不再设置isLoading为true，以避免播放切换时的闪烁
  errorMessage.value = ''
  
  try {
    audioElement.value.src = url
    audioElement.value.load()
    audioElement.value.volume = volume.value
  } catch (error) {
    console.error('音频加载失败:', error)
    errorMessage.value = '音频加载失败'
    isLoading.value = false
  }
}

// 播放/暂停切换
const togglePlay = () => {
  if (!audioElement.value) return
  
  if (isPlaying.value) {
    audioElement.value.pause()
  } else {
    audioElement.value.play().catch(error => {
      console.error('播放失败:', error)
      errorMessage.value = '播放失败，请检查音频文件'
    })
  }
  
  // 通知父组件播放状态变化
  emit('play-state-changed', isPlaying.value)
}

// 静音切换
const toggleMute = () => {
  if (!audioElement.value) return
  
  isMuted.value = !isMuted.value
  audioElement.value.muted = isMuted.value
}

// 更新音量
const updateVolume = () => {
  if (!audioElement.value) return
  
  audioElement.value.volume = volume.value
  isMuted.value = volume.value === 0
}

// 格式化时间
const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00'
  
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

// 获取播放状态文本
const getPlayStatusText = () => {
  const playStatus = isPlaying.value ? '正在播放' : '已暂停'
  const type = props.playlistType || playlistType.value
  
  if (type === 'original') {
    return `原文朗读 - ${playStatus}`
  } else if (type === 'podcast') {
    return `双人播客 - ${playStatus}`
  }
  
  return playStatus
}

// 设置音频信息
const setAudioInfo = (info) => {
  audioInfo.value = { ...audioInfo.value, ...info }
}

// 设置音频URL
const setAudioUrl = (url) => {
  audioUrl.value = url
}
 // v0.8: 设置播放列表，并从第一条开始播放
const setPlaylist = (urls = [], type = null) => {
  // 防御空值
  const list = Array.isArray(urls) ? urls.filter(Boolean) : []
  playlist.value = list
  playlistType.value = type // 设置播放列表类型
  if (list.length > 0) {
    currentIndex.value = 0
    setAudioUrl(list[0])
  } else {
    currentIndex.value = -1
  }
}
 // v0.8: 设置加载态（外部轮询时可显示“音频生成中...”）
const setLoading = (loading) => {
  isLoading.value = !!loading
}

// 重置播放器
const resetPlayer = () => {
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
  }
  
  audioUrl.value = ''
  isPlaying.value = false
  currentTime.value = 0
  duration.value = 0
  progressPercentage.value = 0
  errorMessage.value = ''
  audioInfo.value = {
    text: '',
    voice: '',
    language: '',
    fileSize: 0
  }
  isPlaybackCompleted.value = false  // 重置播放完成状态
  playlistType.value = null // 重置播放列表类型
}

// 重播功能
const replay = () => {
  if (playlist.value.length > 0) {
    currentIndex.value = 0
    setAudioUrl(playlist.value[0])
    isPlaybackCompleted.value = false  // 重置播放完成状态
    // 延迟播放，确保音频加载完成
    setTimeout(() => {
      if (audioElement.value) {
        isPlaying.value = true
        audioElement.value.play().catch(err => {
          console.error('重播失败:', err)
          errorMessage.value = '重播失败: ' + (err.message || '未知错误')
        })
      }
    }, 100)
  }
}

// 播放指定索引的音频
const playAtIndex = (index) => {
  if (index >= 0 && index < playlist.value.length) {
    currentIndex.value = index
    setAudioUrl(playlist.value[index])
    // 不显示加载状态，直接播放
    setTimeout(() => {
      if (audioElement.value) {
        audioElement.value.play().catch(err => {
          console.error('播放音频失败:', err)
          errorMessage.value = '播放音频失败: ' + (err.message || '未知错误')
        })
      }
    }, 100)
  }
}

// 播放下一个音频
const playNext = () => {
  if (playlist.value.length > 0 && currentIndex.value >= 0) {
    const nextIndex = currentIndex.value + 1
    if (nextIndex < playlist.value.length) {
      playAtIndex(nextIndex)
    }
  }
}

// 播放上一个音频
const playPrevious = () => {
  if (playlist.value.length > 0 && currentIndex.value > 0) {
    const prevIndex = currentIndex.value - 1
    playAtIndex(prevIndex)
  }
}

// 暴露给父组件的方法
defineExpose({
  setAudioUrl,
  setAudioInfo,
  // v0.8: 暴露播放列表与加载态设置方法
  setPlaylist,
  setLoading,
  resetPlayer,
  replay,  // 暴露重播方法
  play: () => {
    isPlaybackCompleted.value = false  // 重置播放完成状态
    return audioElement.value?.play()
  },
  pause: () => audioElement.value?.pause(),
  // 新增播放控制方法
  playNext,
  playPrevious,
  playAtIndex
})
</script>

<style scoped>
.audio-player-container {
  max-width: 600px;
  margin: 0 auto;
}

.range {
  --range-shdw: 59 130 246;
}

.range-primary {
  --range-shdw: 59 130 246;
}

.btn-circle {
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 音量控制样式 */
.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}
</style>