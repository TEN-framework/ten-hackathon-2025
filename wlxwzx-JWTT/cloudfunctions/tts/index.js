const cloud = require('@cloudbase/node-sdk')

// 初始化云开发
const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV
})

// TTS配置
const TTS_API_KEY = process.env.TTS_API_KEY || 'sk-2126cb95302b4e0896d79e2ebd11858b'
const TTS_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'

/**
 * TTS语音合成云函数
 * @param {Object} event - 事件对象
 * @param {string} event.text - 要合成的文本
 * @param {string} event.voice - 音色（可选，默认：'zhitian_emo'）
 * @param {string} event.language - 语言（可选，默认：'zh'）
 * @returns {Promise<Object>} 合成结果
 */
exports.main = async (event) => {
  try {
    console.log('开始TTS语音合成:', { 
      textLength: event.text?.length || 0,
      voice: event.voice,
      language: event.language
    })
    
    // 参数验证
    if (!event.text || event.text.trim() === '') {
      throw new Error('text参数不能为空')
    }
    
    const text = event.text.trim()
    const voice = event.voice || 'zhitian_emo'
    const language = event.language || 'zh'
    
    // 构建请求数据
    const requestData = {
      model: 'qwen3-tts-flash',
      input: {
        text: text,
        voice: voice,
        language_type: language
      }
    }
    
    console.log('TTS请求数据:', requestData)
    
    // 调用阿里云TTS API
    const response = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TTS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    
    if (!response.ok) {
      throw new Error(`TTS API请求失败: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('TTS API响应:', result)
    
    // 检查响应结构
    if (result.code) {
      throw new Error(`TTS服务错误: ${result.message || result.code}`)
    }
    
    if (!result.output || !result.output.audio || !result.output.audio.url) {
      throw new Error('TTS响应格式不正确，缺少音频URL')
    }
    
    const audioUrl = result.output.audio.url
    console.log('TTS合成成功，音频URL:', audioUrl)
    
    return {
      success: true,
      audioUrl: audioUrl,
      requestId: result.request_id,
      text: text,
      voice: voice
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