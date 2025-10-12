import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HomePage from './HomePage.vue'
import { nextTick } from 'vue'

// Mock子组件
vi.mock('../components/VoiceChat.vue', () => ({
  default: {
    template: '<div>Mock VoiceChat</div>',
    props: ['visible', 'inputUrl', 'isPlayerPlaying']
  }
}))

vi.mock('../components/AudioPlayer.vue', () => ({
  default: {
    template: '<div>Mock AudioPlayer</div>',
    props: ['visible'],
    setup(props, { emit }) {
      // 模拟播放器方法
      return {
        setPlaylist: vi.fn(),
        setLoading: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        resetPlayer: vi.fn()
      }
    }
  }
}))

// Mock工具函数
vi.mock('../utils/cloudbase.js', () => ({
  ensureLogin: vi.fn().mockResolvedValue({ user: {} }),
  checkEnvironment: vi.fn().mockReturnValue(true),
  isValidEnvId: true,
  ENV_ID: 'test-env-id'
}))

vi.mock('../utils/new-api-client.js', () => ({
  extractContent: vi.fn().mockResolvedValue({ success: true, data: { id: 'test-id' } }),
  generatePodcast: vi.fn().mockResolvedValue({ success: true }),
  generateTTS: vi.fn().mockResolvedValue({ success: true }),
  getContent: vi.fn().mockResolvedValue({ success: true, data: { ttsc_task: { status: 'completed' }, ttsc_url: [{ download_url: 'test-url' }] } }),
  healthCheck: vi.fn().mockResolvedValue({ success: true })
}))

vi.mock('../utils/url-validator.js', () => ({
  validateUrlInRealTime: vi.fn().mockReturnValue({ isValid: true, message: 'Valid URL', level: 'success' }),
  isValidUrl: vi.fn().mockReturnValue(true),
  normalizeUrl: vi.fn().mockImplementation((url) => url)
}))

describe('HomePage.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(HomePage, {
      global: {
        stubs: {
          VoiceChat: true,
          AudioPlayer: true
        }
      }
    })
  })

  it('应该在URL验证失败时禁用所有功能按钮', async () => {
    // 模拟URL验证失败
    await wrapper.setData({
      urlValidation: {
        isValid: false,
        message: 'Invalid URL',
        level: 'error'
      }
    })

    const buttons = wrapper.findAll('button')
    const originalReadButton = buttons[0]
    const podcastButton = buttons[1]
    const chatButton = buttons[2]

    expect(originalReadButton.attributes('disabled')).toBeDefined()
    expect(podcastButton.attributes('disabled')).toBeDefined()
    expect(chatButton.attributes('disabled')).toBeUndefined() // 聊天按钮不应被禁用
  })

  it('应该在URL验证通过时启用功能按钮', async () => {
    // 模拟URL验证通过
    await wrapper.setData({
      urlValidation: {
        isValid: true,
        message: 'Valid URL',
        level: 'success'
      }
    })

    const buttons = wrapper.findAll('button')
    const originalReadButton = buttons[0]
    const podcastButton = buttons[1]

    expect(originalReadButton.attributes('disabled')).toBeUndefined()
    expect(podcastButton.attributes('disabled')).toBeUndefined()
  })

  it('应该在播放原文列表时禁用原文朗读按钮，启用双人播客按钮', async () => {
    // 模拟URL验证通过
    await wrapper.setData({
      urlValidation: {
        isValid: true,
        message: 'Valid URL',
        level: 'success'
      },
      isPlaying: true,
      currentPlaylistType: 'original'
    })

    await nextTick()

    const buttons = wrapper.findAll('button')
    const originalReadButton = buttons[0]
    const podcastButton = buttons[1]

    expect(originalReadButton.attributes('disabled')).toBeDefined()
    expect(podcastButton.attributes('disabled')).toBeUndefined()
  })

  it('应该在播放播客列表时启用原文朗读按钮，禁用双人播客按钮', async () => {
    // 模拟URL验证通过且正在播放播客
    await wrapper.setData({
      urlValidation: {
        isValid: true,
        message: 'Valid URL',
        level: 'success'
      },
      isPlaying: true,
      currentPlaylistType: 'podcast'
    })

    await nextTick()

    const buttons = wrapper.findAll('button')
    const originalReadButton = buttons[0]
    const podcastButton = buttons[1]

    expect(originalReadButton.attributes('disabled')).toBeUndefined()
    expect(podcastButton.attributes('disabled')).toBeDefined()
  })

  it('应该在点击"跟我聊聊"按钮时暂停播放器', async () => {
    // 模拟播放器正在播放
    await wrapper.setData({
      isPlaying: true
    })

    // 创建spy来监听pause方法
    const pauseSpy = vi.spyOn(wrapper.vm.audioPlayer, 'pause')

    // 点击"跟我聊聊"按钮
    const chatButton = wrapper.findAll('button')[2]
    await chatButton.trigger('click')

    // 验证播放器被暂停
    expect(pauseSpy).toHaveBeenCalled()
    expect(wrapper.vm.showVoiceChat).toBe(true)
  })

  it('应该在播放完成时重置播放列表类型', async () => {
    // 模拟正在播放
    await wrapper.setData({
      isPlaying: true,
      currentPlaylistType: 'original'
    })

    // 触发播放完成事件
    wrapper.vm.handlePlaybackCompleted()

    // 验证播放状态和播放列表类型被重置
    expect(wrapper.vm.isPlaying).toBe(false)
    expect(wrapper.vm.currentPlaylistType).toBe(null)
  })
})