const cloud = require('@cloudbase/node-sdk')

const app = cloud.init({
  env: 'cloud1-8grkg0ar5f169249'
})

const db = app.database()

/**
 * 处理音频内容的云函数
 * 根据需求v0.5.2：
 * 1. 将原文内容分割成不超过500字符的片段，更新到tts_content字段（一维字符串数组）
 * 2. 将播客稿content数组按单双索引拆分，更新到tts_podcast字段（二维数组）
 * 
 * 字段说明：
 * - tts_content: 用于原文朗读的分段内容 ["段落1", "段落2", ...]
 * - tts_podcast: 用于双人播客的分组内容 [["男声内容1", "男声内容2"], ["女声内容1", "女声内容2"]]
 */
exports.main = async (event, context) => {
  try {
    console.log('接收到的参数:', event)
    
    const { recordId, docId } = event
    const id = recordId || docId
    
    if (!id) {
      return {
        success: false,
        error: '缺少recordId或docId参数'
      }
    }

    // 查询记录
    console.log('开始查询记录，ID:', id)
    const queryResult = await db.collection('extracted_contents').where({
      _id: id
    }).get()
    
    console.log('查询结果:', queryResult)
    
    if (!queryResult.data || queryResult.data.length === 0) {
      return {
        success: false,
        error: '未找到指定记录'
      }
    }

    // 获取第一条记录
    let data = queryResult.data[0]
    console.log('原始数据类型:', typeof data)
    
    // 如果是字符串，需要解析JSON
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
        console.log('JSON解析成功')
      } catch (e) {
        console.error('JSON解析失败:', e)
        return {
          success: false,
          error: 'JSON解析失败: ' + e.message
        }
      }
    }
    
    console.log('解析后数据类型:', typeof data)
    console.log('找到记录:', data.title || '无标题')
    console.log('记录ID:', data._id)
    console.log('内容长度:', data.content ? data.content.length : 0)
    console.log('播客内容:', data.podcast ? '存在' : '不存在')
    console.log('数据字段:', Object.keys(data))

    let updateData = {
      tts_updated_at: new Date().toISOString()
    }

    // 根据v0.5.2需求，分别处理两种内容：
    // 1. 处理原文内容 → tts_content字段
    // 2. 处理播客稿内容 → tts_podcast字段
    
    // 处理原文内容 - 分割成不超过500字符的片段到 tts_content 字段
    if (data.content && data.content.length > 0) {
      console.log('处理原文内容，长度:', data.content.length)
      const segments = []
      const maxLength = 500
      
      for (let i = 0; i < data.content.length; i += maxLength) {
        const segment = data.content.substring(i, i + maxLength)
        if (segment.trim()) {
          segments.push(segment.trim())
        }
      }
      
      updateData.tts_content = segments
      console.log('原文分割完成，共', segments.length, '个片段')
      console.log('前3个片段预览:', segments.slice(0, 3))
    }
    
    // 处理播客稿 - 检查是否已有正确格式的tts_podcast字段
    if (data.podcast && data.podcast.content && Array.isArray(data.podcast.content)) {
      console.log('检查播客稿内容，共', data.podcast.content.length, '条')
      
      // 检查是否已有正确格式的tts_podcast字段
      if (!data.tts_podcast || !Array.isArray(data.tts_podcast) || data.tts_podcast.length !== 2) {
        console.log('tts_podcast字段不存在或格式不正确，重新生成...')
        
        const evenIndexContent = []  // 偶数索引 (0,2,4...)
        const oddIndexContent = []   // 奇数索引 (1,3,5...)
        
        for (let i = 0; i < data.podcast.content.length; i++) {
          if (i % 2 === 0) {
            evenIndexContent.push(data.podcast.content[i])
          } else {
            oddIndexContent.push(data.podcast.content[i])
          }
        }
        
        // 按需求格式：tts_podcast=[["000","222"],["111","333"]]
        updateData.tts_podcast = [evenIndexContent, oddIndexContent]
        console.log('播客稿拆分完成，偶数组:', evenIndexContent.length, '条，奇数组:', oddIndexContent.length, '条')
      } else {
        console.log('tts_podcast字段已存在且格式正确，跳过处理')
      }
    }

    // 更新记录
    const updateResult = await db.collection('extracted_contents').doc(id).update(updateData)
    console.log('数据库更新结果:', updateResult)
    
    console.log('更新完成')
    
    // 根据处理结果返回信息
    let result = {
      success: true,
      message: '内容处理完成',
      updated_fields: Object.keys(updateData)
    }
    
    // 添加处理结果详情
    if (updateData.tts_content) {
      result.tts_content_segments = updateData.tts_content.length
      result.has_tts_content = true
    }
    
    if (updateData.tts_podcast) {
      result.tts_podcast_groups = updateData.tts_podcast.length
      result.group_0_count = updateData.tts_podcast[0] ? updateData.tts_podcast[0].length : 0
      result.group_1_count = updateData.tts_podcast[1] ? updateData.tts_podcast[1].length : 0
      result.has_tts_podcast = true
    }
    
    if (!updateData.tts_content && !updateData.tts_podcast) {
      result.message = '没有找到可处理的内容'
    }
    
    return result

  } catch (error) {
    console.error('处理失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}