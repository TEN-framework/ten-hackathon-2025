/**
 * 云存储工具类
 * 用于将音频文件上传到腾讯云开发云存储
 */

import { app } from './cloudbase.js'

/**
 * 将Blob保存为临时文件
 * @param {Blob} blob - 要保存的Blob对象
 * @param {string} fileName - 文件名
 * @returns {Promise<string>} 临时文件路径
 */
const saveBlobToTempFile = (blob, fileName) => {
  return new Promise((resolve, reject) => {
    try {
      // 在浏览器环境中，使用URL.createObjectURL创建临时URL
      const tempUrl = URL.createObjectURL(blob)
      console.log('Blob已转换为临时URL:', tempUrl)
      resolve(tempUrl)
    } catch (error) {
      reject(new Error('Blob保存失败: ' + error.message))
    }
  })
}

/**
 * 上传文件到云存储
 * @param {Blob|File} file - 要上传的文件
 * @param {string} cloudPath - 云端文件路径
 * @param {Object} options - 上传选项
 * @returns {Promise<Object>} 上传结果
 */
export const uploadFile = async (file, cloudPath, options = {}) => {
  try {
    console.log('开始上传文件到云存储:', { cloudPath, fileSize: file.size, fileType: file.type })
    
    // 参数验证
    if (!file) {
      throw new Error('文件参数不能为空')
    }
    
    if (!cloudPath || typeof cloudPath !== 'string') {
      throw new Error('云端路径不能为空')
    }
    
    // 确保cloudPath以/开头
    if (!cloudPath.startsWith('/')) {
      cloudPath = '/' + cloudPath
    }
    
    // 如果是Blob对象，需要先保存为临时文件
    let filePath
    if (file instanceof Blob) {
      // 在浏览器环境中，我们无法直接保存文件到本地路径
      // 需要采用不同的策略：将Blob转换为Base64或使用其他方法
      throw new Error('浏览器环境不支持直接上传Blob对象到云存储，请使用其他上传方式')
    } else {
      filePath = file
    }
    
    // 上传文件到云存储
    const result = await app.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath
    })
    
    console.log('文件上传成功:', result)
    
    // 获取文件访问URL
    const fileUrl = await app.getTempFileURL({
      fileList: [result.fileID]
    })
    
    console.log('文件访问URL获取成功:', fileUrl)
    
    return {
      success: true,
      fileID: result.fileID,
      downloadUrl: fileUrl.fileList[0].tempFileURL,
      cloudPath: cloudPath
    }
    
  } catch (error) {
    console.error('文件上传失败:', error)
    
    let errorMessage = '文件上传失败'
    if (error.message.includes('权限')) {
      errorMessage = '云存储权限不足，请检查登录状态'
    } else if (error.message.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络后重试'
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    }
  }
}

/**
 * 上传音频文件到云存储
 * @param {Blob} audioBlob - 音频文件的Blob对象
 * @param {string} fileName - 文件名（不含扩展名）
 * @returns {Promise<Object>} 上传结果
 */
export const uploadAudioFile = async (audioBlob, fileName = 'audio') => {
  try {
    console.log('开始处理音频文件上传:', { fileName, blobSize: audioBlob.size })
    
    // 将Blob转换为Base64字符串
    const base64String = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        // 移除data:audio/wav;base64,前缀
        const base64 = reader.result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(audioBlob)
    })
    
    console.log('音频文件已转换为Base64，长度:', base64String.length)
    
    // 生成唯一的文件名
    const timestamp = new Date().getTime()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const cloudPath = `audios/${fileName}_${timestamp}_${randomStr}.wav`
    
    // 调用云函数处理音频文件上传
    const result = await app.callFunction({
      name: 'uploadAudio',
      data: {
        base64Data: base64String,
        cloudPath: cloudPath,
        fileName: fileName
      }
    })
    
    console.log('云函数调用结果:', result)
    
    if (result.result && result.result.success) {
      return {
        success: true,
        fileID: result.result.fileID,
        downloadUrl: result.result.downloadUrl,
        cloudPath: cloudPath,
        fileName: fileName
      }
    } else {
      throw new Error(result.result?.error || '音频文件上传失败')
    }
    
  } catch (error) {
    console.error('音频文件上传失败:', error)
    
    return {
      success: false,
      error: error.message,
      details: error.message
    }
  }
}

/**
 * 获取文件的临时访问URL
 * @param {string} fileID - 文件ID
 * @returns {Promise<string>} 临时访问URL
 */
export const getFileTempURL = async (fileID) => {
  try {
    const result = await app.getTempFileURL({
      fileList: [fileID]
    })
    
    if (result.fileList && result.fileList.length > 0) {
      return result.fileList[0].tempFileURL
    }
    
    throw new Error('获取文件URL失败')
    
  } catch (error) {
    console.error('获取文件临时URL失败:', error)
    throw error
  }
}

// 默认导出
export default {
  uploadFile,
  uploadAudioFile,
  getFileTempURL
}