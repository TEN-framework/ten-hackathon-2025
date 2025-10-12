/**
 * 数据库操作工具类
 * 用于操作腾讯云开发数据库，保存提取内容和播客稿数据
 */

import { app } from './cloudbase.js'

/**
 * 保存网页内容提取记录到数据库
 * @param {Object} data - 提取的数据
 * @param {string} data.title - 网页标题
 * @param {string} data.content - 网页正文内容
 * @param {string} data.url - 原始网页URL
 * @param {string} data.timestamp - 提取时间戳
 * @returns {Promise<Object>} 保存结果
 */
export const saveExtractedContent = async (data) => {
  try {
    // 参数验证
    if (!data || typeof data !== 'object') {
      throw new Error('数据参数不能为空')
    }
    
    const { title, content, url, timestamp } = data
    
    if (!title || !content || !url || !timestamp) {
      throw new Error('缺少必要的字段：title, content, url, timestamp')
    }
    
    console.log('开始保存提取内容到数据库:', { title, url })
    
    // 构建保存数据
    const saveData = {
      title: title.trim(),
      content: content.trim(),
      url: url.trim(),
      timestamp: timestamp,
      created_at: new Date(),
      updated_at: new Date()
    }
    
    // 调用云开发数据库API保存数据
    const result = await app.database().collection('extracted_contents').add(saveData)
    
    console.log('提取内容保存成功:', result)
    
    return {
      success: true,
      message: '提取内容保存成功',
      data: {
        id: result.id,
        ...saveData
      }
    }
    
  } catch (error) {
    console.error('保存提取内容失败:', error)
    
    // 提供更友好的错误信息
    let errorMessage = '保存提取内容失败'
    if (error.message.includes('权限')) {
      errorMessage = '数据库权限不足，请检查登录状态'
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
 * 保存播客稿生成记录到数据库
 * @param {Object} data - 播客稿数据
 * @param {string} data.original_title - 原始网页标题
 * @param {string} data.podcast_title - 播客稿标题
 * @param {Array} data.content - 对话内容数组
 * @param {string} data.original_url - 原始网页URL
 * @returns {Promise<Object>} 保存结果
 */
export const savePodcastContent = async (data) => {
  try {
    // 参数验证
    if (!data || typeof data !== 'object') {
      throw new Error('数据参数不能为空')
    }
    
    const { original_title, podcast_title, content, original_url } = data
    
    if (!original_title || !podcast_title || !content || !original_url) {
      throw new Error('缺少必要的字段：original_title, podcast_title, content, original_url')
    }
    
    if (!Array.isArray(content)) {
      throw new Error('content字段必须是数组')
    }
    
    console.log('开始保存播客稿到数据库:', { podcast_title, original_url })
    
    // 构建保存数据
    const saveData = {
      original_title: original_title.trim(),
      podcast_title: podcast_title.trim(),
      content: content.map(item => typeof item === 'string' ? item.trim() : String(item)),
      original_url: original_url.trim(),
      created_at: new Date(),
      updated_at: new Date()
    }
    
    // 调用云开发数据库API保存数据
    const result = await app.database().collection('tts_podcasts').add(saveData)
    
    console.log('播客稿保存成功:', result)
    
    return {
      success: true,
      message: '播客稿保存成功',
      data: {
        id: result.id,
        ...saveData
      }
    }
    
  } catch (error) {
    console.error('保存播客稿失败:', error)
    
    // 提供更友好的错误信息
    let errorMessage = '保存播客稿失败'
    if (error.message.includes('权限')) {
      errorMessage = '数据库权限不足，请检查登录状态'
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
 * 查询历史记录
 * @param {string} collection - 集合名称 ('extracted_contents' 或 'tts_podcasts')
 * @param {number} limit - 返回记录数量限制，默认10条
 * @returns {Promise<Array>} 历史记录数组
 */
export const getHistory = async (collection, limit = 10) => {
  try {
    // 参数验证
    if (!collection || (collection !== 'extracted_contents' && collection !== 'tts_podcasts')) {
      throw new Error('集合名称必须是 extracted_contents 或 tts_podcasts')
    }
    
    if (limit < 1 || limit > 100) {
      throw new Error('limit参数必须在1-100之间')
    }
    
    console.log(`查询${collection}历史记录，限制${limit}条`)
    
    // 查询数据库，按创建时间倒序排列
    const result = await app.database()
      .collection(collection)
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get()
    
    console.log(`查询到${result.data.length}条记录`)
    
    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
    
  } catch (error) {
    console.error('查询历史记录失败:', error)
    
    return {
      success: false,
      error: '查询历史记录失败',
      details: error.message
    }
  }
}

/**
 * 保存音频记录到数据库
 * @param {Object} data - 音频记录数据
 * @param {string} data.fileID - 云存储文件ID
 * @param {string} data.downloadUrl - 音频文件访问URL
 * @param {string} data.cloudPath - 云端文件路径
 * @param {string} data.fileName - 文件名
 * @param {string} data.text - 合成的文本内容
 * @param {string} data.voice - 使用的音色
 * @param {string} data.language - 语言类型
 * @param {string} data.originalUrl - 原始网页URL（可选）
 * @param {string} data.relatedContentId - 关联的内容ID（可选）
 * @returns {Promise<Object>} 保存结果
 */
export const saveAudioRecord = async (data) => {
  try {
    // 参数验证
    if (!data || typeof data !== 'object') {
      throw new Error('数据参数不能为空')
    }
    
    const { fileID, downloadUrl, cloudPath, fileName, text, voice, language } = data
    
    if (!fileID || !downloadUrl || !cloudPath || !fileName || !text || !voice || !language) {
      throw new Error('缺少必要的字段：fileID, downloadUrl, cloudPath, fileName, text, voice, language')
    }
    
    console.log('开始保存音频记录到数据库:', { fileName, text: text.substring(0, 50) + '...' })
    
    // 构建保存数据
    const saveData = {
      fileID: fileID.trim(),
      downloadUrl: downloadUrl.trim(),
      cloudPath: cloudPath.trim(),
      fileName: fileName.trim(),
      text: text.trim(),
      voice: voice.trim(),
      language: language.trim(),
      originalUrl: data.originalUrl ? data.originalUrl.trim() : '',
      relatedContentId: data.relatedContentId ? data.relatedContentId.trim() : '',
      created_at: new Date(),
      updated_at: new Date()
    }
    
    // 调用云开发数据库API保存数据
    const result = await app.database().collection('audio_records').add(saveData)
    
    console.log('音频记录保存成功:', result)
    
    return {
      success: true,
      message: '音频记录保存成功',
      data: {
        id: result.id,
        ...saveData
      }
    }
    
  } catch (error) {
    console.error('保存音频记录失败:', error)
    
    // 提供更友好的错误信息
    let errorMessage = '保存音频记录失败'
    if (error.message.includes('权限')) {
      errorMessage = '数据库权限不足，请检查登录状态'
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
 * 处理音频内容 - 调用云函数进行内容分割和拆分
 * @param {string} docId - 文档ID
 * @param {string} type - 处理类型：'original'(原文) 或 'podcast'(播客稿)
 * @returns {Promise<Object>} 处理结果
 */
export const processAudioContent = async (docId, type) => {
  try {
    // 参数验证
    if (!docId) {
      throw new Error('文档ID不能为空')
    }
    
    if (!type || !['original', 'podcast'].includes(type)) {
      throw new Error('处理类型必须是 original 或 podcast')
    }
    
    console.log('开始处理音频内容:', { docId, type })
    
    // 调用云函数
    const result = await app.callFunction({
      name: 'processAudioContent',
      data: {
        docId: docId,
        type: type
      }
    })
    
    console.log('音频内容处理完成:', result.result)
    
    if (result.result && result.result.success) {
      return {
        success: true,
        data: result.result.data,
        message: '音频内容处理成功'
      }
    } else {
      throw new Error(result.result?.error || '音频内容处理失败')
    }
    
  } catch (error) {
    console.error('处理音频内容失败:', error)
    
    return {
      success: false,
      error: '处理音频内容失败',
      details: error.message
    }
  }
}

/**
 * 保存网页内容提取记录到数据库（更新版本，支持音频内容处理）
 * @param {Object} data - 提取的数据
 * @param {string} data.title - 网页标题
 * @param {string} data.content - 网页正文内容
 * @param {string} data.url - 原始网页URL
 * @param {string} data.timestamp - 提取时间戳
 * @param {boolean} processAudio - 是否自动处理音频内容，默认true
 * @returns {Promise<Object>} 保存结果
 */
export const saveExtractedContentWithAudio = async (data, processAudio = true) => {
  try {
    // 先保存基础内容
    const saveResult = await saveExtractedContent(data)
    
    if (!saveResult.success) {
      return saveResult
    }
    
    // 如果需要处理音频内容，调用音频处理云函数
    if (processAudio) {
      console.log('开始处理原文音频内容...')
      const audioResult = await processAudioContent(saveResult.data.id, 'original')
      
      if (audioResult.success) {
        console.log('原文音频内容处理成功')
        return {
          ...saveResult,
          audioProcessed: true,
          audioData: audioResult.data
        }
      } else {
        console.warn('原文音频内容处理失败:', audioResult.error)
        // 不影响主流程，继续返回保存结果
        return {
          ...saveResult,
          audioProcessed: false,
          audioError: audioResult.error
        }
      }
    }
    
    return saveResult
    
  } catch (error) {
    console.error('保存内容并处理音频失败:', error)
    return {
      success: false,
      error: '保存内容并处理音频失败',
      details: error.message
    }
  }
}

/**
 * 保存播客稿生成记录到数据库（更新版本，支持音频内容处理）
 * @param {Object} data - 播客稿数据
 * @param {string} data.original_title - 原始网页标题
 * @param {string} data.podcast_title - 播客稿标题
 * @param {Array} data.content - 对话内容数组
 * @param {string} data.original_url - 原始网页URL
 * @param {boolean} processAudio - 是否自动处理音频内容，默认true
 * @returns {Promise<Object>} 保存结果
 */
export const savePodcastContentWithAudio = async (data, processAudio = true) => {
  try {
    console.log('开始保存播客稿到数据库，URL:', data.original_url)
    
    // 首先查询是否已存在相同URL的记录
    const existingQuery = await app.database().collection('extracted_contents')
      .where({
        url: data.original_url
      })
      .get()
    
    let result
    let isUpdate = false
    
    if (existingQuery.data && existingQuery.data.length > 0) {
      // 更新现有记录
      console.log('找到现有记录，更新播客稿内容')
      isUpdate = true
      const existingRecord = existingQuery.data[0]
      
      // 按照v0.5.2需求，将播客稿content数组按单双索引拆分为二维数组
      const evenIndexContent = []  // 偶数索引 (0,2,4...)
      const oddIndexContent = []   // 奇数索引 (1,3,5...)
      
      for (let i = 0; i < data.content.length; i++) {
        if (i % 2 === 0) {
          evenIndexContent.push(data.content[i])
        } else {
          oddIndexContent.push(data.content[i])
        }
      }
      
      // 构建更新数据
      const updateData = {
        podcast: {
          title: data.podcast_title,
          content: data.content
        },
        tts_podcast: [evenIndexContent, oddIndexContent], // 二维数组格式
        updated_at: new Date(),
        podcast_updated_at: new Date().toISOString()
      }
      
      // 更新记录
      await app.database().collection('extracted_contents')
        .doc(existingRecord._id)
        .update(updateData)
      
      result = { id: existingRecord._id }
      console.log('播客稿更新成功，记录ID:', existingRecord._id)
      
    } else {
      // 创建新记录（这种情况不应该发生，因为应该先有原文提取）
      console.log('未找到现有记录，创建新记录')
      
      // 按照v0.5.2需求拆分播客稿内容
      const evenIndexContent = []
      const oddIndexContent = []
      
      for (let i = 0; i < data.content.length; i++) {
        if (i % 2 === 0) {
          evenIndexContent.push(data.content[i])
        } else {
          oddIndexContent.push(data.content[i])
        }
      }
      
      const saveData = {
        title: data.original_title,
        content: '', // 原文内容应该由v0.2提取
        podcast: {
          title: data.podcast_title,
          content: data.content
        },
        tts_podcast: [evenIndexContent, oddIndexContent], // 二维数组格式
        url: data.original_url,
        created_at: new Date(),
        updated_at: new Date(),
        timestamp: new Date().toISOString()
      }
      
      const addResult = await app.database().collection('extracted_contents').add(saveData)
      result = addResult
      console.log('新播客稿记录创建成功:', result.id)
    }
    
    // 播客稿已经在上面处理了tts_podcast字段，不需要额外的音频处理
    // 因为v0.5.2的逻辑已经在保存时完成了单双拆分
    
    return {
      success: true,
      message: isUpdate ? '播客稿更新成功，tts_podcast字段已按单双索引拆分' : '播客稿保存成功，tts_podcast字段已按单双索引拆分',
      data: {
        id: result.id,
        isUpdate: isUpdate,
        tts_podcast_format: '二维数组 [偶数索引内容, 奇数索引内容]'
      },
      audioProcessed: true, // 标记为已处理，因为tts_podcast已经正确格式化
      audioData: {
        tts_content: isUpdate ? '保持原有分段' : '需要原文朗读后生成',
        tts_podcast: '已按单双索引拆分为二维数组'
      }
    }
    
  } catch (error) {
    console.error('保存播客稿并处理音频失败:', error)
    
    return {
      success: false,
      error: '保存播客稿并处理音频失败',
      details: error.message
    }
  }
}

/**
 * 测试数据库连接
 * @returns {Promise<boolean>} 连接是否成功
 */
export const testDatabaseConnection = async () => {
  try {
    // 尝试查询一条记录来测试连接
    const result = await app.database().collection('extracted_contents').limit(1).get()
    console.log('数据库连接测试成功')
    return true
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    return false
  }
}

// 默认导出
export default {
  saveExtractedContent,
  saveExtractedContentWithAudio,
  savePodcastContent,
  savePodcastContentWithAudio,
  saveAudioRecord,
  getHistory,
  processAudioContent,
  testDatabaseConnection
}