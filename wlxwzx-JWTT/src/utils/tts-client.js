/**
 * TTS语音合成工具类
 * 使用阿里云通义千问TTS服务进行语音合成
 */

import { app } from './cloudbase.js'

/**
 * 调用TTS服务合成语音
 * @param {string} text - 要合成的文本
 * @param {string} voice - 音色名称，默认'Cherry'
 * @param {string} language - 语言类型，默认'Chinese'
 * @returns {Promise<Object>} 合成结果，包含音频URL
 */
export const synthesizeSpeech = async (text, voice = 'Cherry', language = 'Chinese') => {
  try {
    console.log('开始TTS语音合成:', { text, voice, language })
    
    // 参数验证
    if (!text || typeof text !== 'string') {
      throw new Error('文本参数不能为空')
    }
    
    if (text.length > 600) {
      throw new Error('文本长度不能超过600字符')
    }
    
    // 调用TTS云函数
    const result = await app.callFunction({
      name: 'tts',
      data: {
        text: text.trim(),
        voice: voice,
        language: language
      }
    })
    
    console.log('TTS云函数调用结果:', result)
    
    if (result.result && result.result.success) {
      return {
        success: true,
        audioUrl: result.result.audioUrl,
        requestId: result.result.requestId
      }
    } else {
      throw new Error(result.result?.error || 'TTS语音合成失败')
    }
    
  } catch (error) {
    console.error('TTS语音合成失败:', error)
    
    return {
      success: false,
      error: error.message,
      details: error.message
    }
  }
}



/**
 * 下载音频文件到本地
 * @param {string} audioUrl - TTS返回的音频URL
 * @returns {Promise<Blob>} 音频文件的Blob对象
 */
export const downloadAudio = async (audioUrl) => {
  try {
    console.log('开始下载音频文件:', audioUrl)
    
    const response = await fetch(audioUrl)
    
    if (!response.ok) {
      throw new Error(`下载音频失败: ${response.status}`)
    }
    
    const blob = await response.blob()
    console.log('音频下载成功，大小:', blob.size, '类型:', blob.type)
    
    return blob
    
  } catch (error) {
    console.error('下载音频文件失败:', error)
    throw error
  }
}

/**
 * 生成默认的欢迎语音
 * @returns {Promise<Object>} 合成结果
 */
export const generateWelcomeSpeech = async () => {
  return await synthesizeSpeech('你好，讲我听听', 'Cherry', 'Chinese')
}

// 默认导出
export default {
  synthesizeSpeech,
  downloadAudio,
  generateWelcomeSpeech
}