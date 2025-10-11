/**
 * 新架构API客户端
 * 用于替换直接的数据库访问，统一通过content-api进行数据操作
 */

import { app } from './cloudbase.js'

/**
 * 内容API客户端类
 */
class ContentAPIClient {
  constructor() {
    this.baseApiUrl = '/content-api' // API网关路径
  }

  /**
   * 提取网页内容
   * @param {string} url - 网页URL
   * @param {Object} options - 提取选项
   * @returns {Promise<Object>} 提取结果
   */
  async extractContent(url, options = {}) {
    try {
      console.log('调用新架构API提取内容:', url)
      
      const result = await app.callFunction({
        name: 'content-api',
        data: {
          path: '/extract',
          httpMethod: 'POST',
          body: JSON.stringify({
            url,
            options
          })
        }
      })
      
      if (result.result && result.result.statusCode === 200) {
        const response = JSON.parse(result.result.body)
        console.log('内容提取成功:', response.message)
        return response
      } else {
        throw new Error('API调用失败')
      }
      
    } catch (error) {
      console.error('提取内容失败:', error)
      return {
        success: false,
        error: error.message,
        message: '提取内容失败'
      }
    }
  }

  /**
   * 生成播客稿
   * @param {string} contentId - 内容ID
   * @param {string} style - 播客风格
   * @returns {Promise<Object>} 生成结果
   */
  async generatePodcast(contentId, style = '科普风格') {
    try {
      console.log('调用新架构API生成播客:', contentId)
      
      const result = await app.callFunction({
        name: 'content-api',
        data: {
          path: '/podcast',
          httpMethod: 'POST',
          body: JSON.stringify({
            content_id: contentId,
            style
          })
        }
      })
      
      if (result.result && result.result.statusCode === 200) {
        const response = JSON.parse(result.result.body)
        console.log('播客生成成功:', response.message)
        return response
      } else {
        throw new Error('API调用失败')
      }
      
    } catch (error) {
      console.error('生成播客失败:', error)
      return {
        success: false,
        error: error.message,
        message: '生成播客失败'
      }
    }
  }

  /**
   * 生成TTS音频
   * @param {string} contentId - 内容ID
   * @param {string} audioType - 音频类型 ('original' | 'podcast')
   * @returns {Promise<Object>} 生成结果
   */
  async generateTTS(contentId, audioType) {
    try {
      console.log('调用新架构API生成TTS:', contentId, audioType)
      
      const result = await app.callFunction({
        name: 'content-api',
        data: {
          path: '/tts/generate',
          httpMethod: 'POST',
          body: JSON.stringify({
            content_id: contentId,
            audio_type: audioType
          })
        }
      })
      
      // v0.8: /tts/generate 可能返回 202（已接受，异步处理）
      if (result.result && (result.result.statusCode === 200 || result.result.statusCode === 202)) {
        const response = JSON.parse(result.result.body)
        console.log('TTS生成已受理/完成:', response.message || 'accepted')
        return response
      } else {
        throw new Error('API调用失败')
      }
      
    } catch (error) {
      console.error('生成TTS失败:', error)
      return {
        success: false,
        error: error.message,
        message: '生成TTS失败'
      }
    }
  }

  /**
   * 获取内容详情
   * @param {string} contentId - 内容ID
   * @returns {Promise<Object>} 内容详情
   */
  async getContent(contentId) {
    try {
      console.log('调用新架构API获取内容:', contentId)
      
      const result = await app.callFunction({
        name: 'content-api',
        data: {
          path: `/content/${contentId}`,
          httpMethod: 'GET'
        }
      })
      
      if (result.result && result.result.statusCode === 200) {
        const response = JSON.parse(result.result.body)
        return response
      } else {
        throw new Error('API调用失败')
      }
      
    } catch (error) {
      console.error('获取内容失败:', error)
      return {
        success: false,
        error: error.message,
        message: '获取内容失败'
      }
    }
  }

  /**
   * 获取历史记录
   * @param {number} limit - 记录数量限制
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 历史记录
   */
  async getHistory(limit = 10, offset = 0) {
    try {
      console.log('调用新架构API获取历史记录')
      
      const result = await app.callFunction({
        name: 'content-api',
        data: {
          path: '/history',
          httpMethod: 'GET',
          queryStringParameters: {
            limit: limit.toString(),
            offset: offset.toString()
          }
        }
      })
      
      if (result.result && result.result.statusCode === 200) {
        const response = JSON.parse(result.result.body)
        return response
      } else {
        throw new Error('API调用失败')
      }
      
    } catch (error) {
      console.error('获取历史记录失败:', error)
      return {
        success: false,
        error: error.message,
        message: '获取历史记录失败'
      }
    }
  }

  /**
   * 检查API健康状态
   * @returns {Promise<Object>} 健康状态
   */
  async healthCheck() {
    try {
      const result = await app.callFunction({
        name: 'content-api',
        data: {
          path: '/health',
          httpMethod: 'GET'
        }
      })
      
      if (result.result && result.result.statusCode === 200) {
        const response = JSON.parse(result.result.body)
        return response
      } else {
        throw new Error('API调用失败')
      }
      
    } catch (error) {
      console.error('健康检查失败:', error)
      return {
        success: false,
        error: error.message,
        message: '健康检查失败'
      }
    }
  }
}

// 创建全局实例
const contentAPI = new ContentAPIClient()

/**
 * 统一错误处理函数
 * @param {Function} apiCall - API调用函数
 * @param {Object} errorUI - 错误UI更新对象
 * @returns {Function} 包装后的API调用函数
 */
export const withErrorHandling = (apiCall, errorUI = {}) => {
  return async (...args) => {
    try {
      // 显示加载状态
      if (errorUI.setLoading) {
        errorUI.setLoading(true)
      }
      
      // 清除之前的错误
      if (errorUI.setError) {
        errorUI.setError(null)
      }
      
      // 执行API调用
      const result = await apiCall(...args)
      
      // 检查结果
      if (!result.success) {
        throw new Error(result.message || '操作失败')
      }
      
      return result
      
    } catch (error) {
      // 设置错误状态
      if (errorUI.setError) {
        errorUI.setError(error.message)
      }
      
      // 显示错误提示
      if (errorUI.showError) {
        errorUI.showError(error.message)
      }
      
      throw error
      
    } finally {
      // 隐藏加载状态
      if (errorUI.setLoading) {
        errorUI.setLoading(false)
      }
    }
  }
}

// 导出API方法
export const extractContent = (url, options) => contentAPI.extractContent(url, options)
export const generatePodcast = (contentId, style) => contentAPI.generatePodcast(contentId, style)
export const generateTTS = (contentId, audioType) => contentAPI.generateTTS(contentId, audioType)
export const getContent = (contentId) => contentAPI.getContent(contentId)
export const getHistory = (limit, offset) => contentAPI.getHistory(limit, offset)
export const healthCheck = () => contentAPI.healthCheck()

// 默认导出
export default contentAPI

/**
 * 使用示例：
 * 
 * import { extractContent, generatePodcast, withErrorHandling } from './new-api-client.js'
 * 
 * // 基本使用
 * const result = await extractContent('https://example.com')
 * 
 * // 带错误处理的使用
 * const extractWithError = withErrorHandling(extractContent, {
 *   setLoading: (loading) => { this.loading = loading },
 *   setError: (error) => { this.error = error }
 * })
 * 
 * await extractWithError('https://example.com')
 */