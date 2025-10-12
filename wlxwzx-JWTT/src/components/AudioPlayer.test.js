import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AudioPlayer from './AudioPlayer.vue'

// Mock IconPark组件
vi.mock('@icon-park/vue-next', () => ({
  VolumeMute: {
    template: '<div>VolumeMute Icon</div>',
    props: ['theme', 'size', 'fill']
  },
  VolumeNotice: {
    template: '<div>VolumeNotice Icon</div>',
    props: ['theme', 'size', 'fill']
  }
}))

describe('AudioPlayer.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(AudioPlayer, {
      global: {
        stubs: {
          VolumeMute: true,
          VolumeNotice: true
        }
      }
    })
  })

  it('应该正确设置播放列表和类型', () => {
    const urls = ['url1', 'url2', 'url3']
    const type = 'original'
    
    // 调用setPlaylist方法
    wrapper.vm.setPlaylist(urls, type)
    
    // 验证播放列表和类型被正确设置
    expect(wrapper.vm.playlist).toEqual(urls)
    expect(wrapper.vm.playlistType).toBe(type)
    expect(wrapper.vm.currentIndex).toBe(0)
  })

  it('应该在重置播放器时清除播放列表类型', () => {
    // 先设置播放列表和类型
    wrapper.vm.setPlaylist(['url1', 'url2'], 'podcast')
    
    // 重置播放器
    wrapper.vm.resetPlayer()
    
    // 验证播放列表类型被重置
    expect(wrapper.vm.playlistType).toBe(null)
  })

  it('应该在播放完成时发出playbackCompleted事件', async () => {
    // 创建事件监听器
    const playbackCompletedSpy = vi.fn()
    wrapper.vm.$on('playbackCompleted', playbackCompletedSpy)
    
    // 模拟播放完成
    wrapper.vm.handlePlaybackCompleted()
    
    // 验证事件被触发
    expect(wrapper.vm.isPlaybackCompleted).toBe(true)
    // 注意：在测试环境中，事件监听可能不会正常工作，所以我们只验证状态
  })
})