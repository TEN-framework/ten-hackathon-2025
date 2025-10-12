const cloud = require('@cloudbase/node-sdk')

// 初始化云开发
const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV
})

/**
 * 上传音频文件到云存储
 * @param {Object} event - 事件对象
 * @param {string} event.base64Data - Base64编码的音频数据
 * @param {string} event.cloudPath - 云端文件路径
 * @param {string} event.fileName - 文件名
 * @returns {Promise<Object>} 上传结果
 */
exports.main = async (event) => {
  try {
    console.log('开始处理音频文件上传:', { 
      cloudPath: event.cloudPath, 
      fileName: event.fileName,
      base64DataLength: event.base64Data?.length || 0
    })
    
    // 参数验证
    if (!event.base64Data) {
      throw new Error('base64Data参数不能为空')
    }
    
    if (!event.cloudPath) {
      throw new Error('cloudPath参数不能为空')
    }
    
    // 将Base64数据转换为Buffer
    const buffer = Buffer.from(event.base64Data, 'base64')
    console.log('Base64数据已转换为Buffer，大小:', buffer.length)
    
    // 上传文件到云存储
    const uploadResult = await app.uploadFile({
      cloudPath: event.cloudPath,
      fileContent: buffer
    })
    
    console.log('文件上传成功:', uploadResult)
    
    // 获取文件访问URL
    const fileUrl = await app.getTempFileURL({
      fileList: [uploadResult.fileID]
    })
    
    console.log('文件访问URL获取成功:', fileUrl)
    
    return {
      success: true,
      fileID: uploadResult.fileID,
      downloadUrl: fileUrl.fileList[0].tempFileURL,
      cloudPath: event.cloudPath,
      fileName: event.fileName
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