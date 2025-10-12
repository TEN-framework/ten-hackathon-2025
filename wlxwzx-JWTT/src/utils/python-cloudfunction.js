/**
 * Python云函数调用工具
 * v0.1.1功能：调用Python云函数提取网页内容
 */

import { app } from './cloudbase.js'

/**
 * 调用Python云函数提取网页内容
 * @param {string} url - 要提取内容的网页URL
 * @returns {Promise<Object>} 提取结果
 */
export const extractWebContentWithPython = async (url) => {
  try {
    console.log('开始调用Python云函数提取网页内容:', url)
    
    // 参数验证
    if (!url || typeof url !== 'string') {
      throw new Error('URL参数不能为空')
    }
    
    // 调用Python云函数
    const result = await app.callFunction({
      name: 'extractContentPy',
      data: {
        url: url
      }
    })
    
    console.log('Python云函数调用结果:', result)
    
    // 检查调用结果
    if (!result || !result.result) {
      throw new Error('云函数调用失败，无返回结果')
    }
    
    const response = result.result
    
    // 检查HTTP状态码
    if (response.statusCode !== 200) {
      const errorBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body
      throw new Error(errorBody?.message || `云函数调用失败，状态码: ${response.statusCode}`)
    }
    
    // 解析响应体
    const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body
    
    if (body.code !== 200) {
      throw new Error(body.message || '网页内容提取失败')
    }
    
    console.log('网页内容提取成功:', {
      title: body.data?.title,
      contentLength: body.data?.content_length
    })
    
    return {
      success: true,
      data: body.data,
      message: '网页内容提取成功'
    }
    
  } catch (error) {
    console.error('调用Python云函数失败:', error)
    
    // 提供更友好的错误信息
    let errorMessage = '网页内容提取失败'
    
    if (error.message.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络后重试'
    } else if (error.message.includes('权限')) {
      errorMessage = '云函数调用权限不足，请检查登录状态'
    } else if (error.message.includes('超时')) {
      errorMessage = '请求超时，请稍后重试'
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    }
  }
}

/**
 * 验证URL并提取网页内容（v0.1.1完整流程）
 * @param {string} url - 要验证和提取的URL
 * @returns {Promise<Object>} 完整流程结果
 */
export const validateAndExtractContent = async (url) => {
  try {
    console.log('开始v0.1.1流程 - 验证URL并提取内容:', url)
    
    // 1. 验证URL格式
    const { isValidUrl, normalizeUrl } = await import('./url-validator.js')
    
    const normalizedUrl = normalizeUrl(url)
    
    if (!isValidUrl(normalizedUrl)) {
      return {
        success: false,
        error: 'URL格式不正确，请检查输入',
        step: 'url_validation'
      }
    }
    
    console.log('URL格式验证通过:', normalizedUrl)
    
    // 2. 调用Python云函数提取内容
    const extractResult = await extractWebContentWithPython(normalizedUrl)
    
    if (!extractResult.success) {
      return {
        ...extractResult,
        step: 'content_extraction'
      }
    }
    
    console.log('v0.1.1流程完成')
    
    return {
      success: true,
      data: extractResult.data,
      message: '网页内容提取成功',
      step: 'complete'
    }
    
  } catch (error) {
    console.error('v0.1.1流程执行失败:', error)
    
    return {
      success: false,
      error: '网页内容提取流程执行失败',
      details: error.message,
      step: 'unknown'
    }
  }
}

export default {
  extractWebContentWithPython,
  validateAndExtractContent
}