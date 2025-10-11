/**
 * 数据库服务类
 * 统一数据库访问接口，处理所有数据CRUD操作
 */

const cloud = require('@cloudbase/node-sdk');
const { APIResponse, ProcessStatus, ContentModel } = require('./response');

class DatabaseService {
  constructor() {
    // 初始化云开发SDK
    this.app = cloud.init({
      env: cloud.SYMBOL_CURRENT_ENV
    });
    this.db = this.app.database();
    this.collections = {
      EXTRACTED_CONTENTS: 'extracted_contents',
      AUDIO_RECORDS: 'audio_records',
    };
  }

  /**
   * 保存内容记录
   * @param {Object} contentData - 内容数据
   * @returns {Promise<Object>} 保存结果
   */
  async saveContent(contentData) {
    try {
      console.log('DatabaseService: 开始保存内容记录', { url: contentData.url });
      
      // 数据验证
      const validation = ContentModel.validate(contentData);
      if (!validation.valid) {
        console.log('DatabaseService: 数据验证失败', validation.errors);
        return APIResponse.badRequest('数据验证失败', { errors: validation.errors });
      }
      
      // 数据标准化
      const normalizedData = ContentModel.normalize(contentData);
      console.log('DatabaseService: 数据标准化完成', { 
        url: normalizedData.url,
        title: normalizedData.title,
        content_length: normalizedData.content_length
      });
      
      // 检查是否已存在相同URL的记录
      console.log('DatabaseService: 查询现有记录', { url: normalizedData.url });
      const existingQuery = await this.db.collection(this.collections.EXTRACTED_CONTENTS)
        .where({ url: normalizedData.url })
        .get();
      
      console.log('DatabaseService: 查询结果', { 
        hasData: !!existingQuery.data, 
        dataLength: existingQuery.data ? existingQuery.data.length : 0 
      });
      
      let result;
      let isUpdate = false;
      
      if (existingQuery.data && existingQuery.data.length > 0) {
        // 更新现有记录
        const existingRecord = existingQuery.data[0];
        isUpdate = true;
        
        console.log('发现现有记录，更新内容:', existingRecord._id);
        
        const updateData = {
          title: normalizedData.title,
          content: normalizedData.content,
          content_length: normalizedData.content_length,
          updated_at: normalizedData.updated_at,
          status: ProcessStatus.EXTRACTED
        };
        
        console.log('DatabaseService: 更新数据', updateData);
        await this.db.collection(this.collections.EXTRACTED_CONTENTS)
          .doc(existingRecord._id)
          .update(updateData);
        
        result = { 
          id: existingRecord._id,
          ...existingRecord,
          ...updateData
        };
      } else {
        // 创建新记录
        console.log('创建新内容记录');
        
        normalizedData.status = ProcessStatus.EXTRACTED;
        console.log('DatabaseService: 插入数据', normalizedData);
        const addResult = await this.db.collection(this.collections.EXTRACTED_CONTENTS)
          .add(normalizedData);
        
        result = {
          id: addResult.id,
          ...normalizedData
        };
      }
      
      console.log('内容记录保存成功:', result.id);
      
      return APIResponse.success({
        id: result.id,
        url: result.url,
        title: result.title,
        content_length: result.content_length,
        status: result.status,
        isUpdate,
        created_at: result.created_at,
        updated_at: result.updated_at
      }, isUpdate ? '内容更新成功' : '内容保存成功');
      
    } catch (error) {
      console.error('DatabaseService: 保存内容记录失败:', error);
      return APIResponse.serverError('保存内容失败', error.message);
    }
  }

  /**
   * 更新播客数据
   * @param {string} contentId - 内容记录ID
   * @param {Object} podcastData - 播客数据
   * @returns {Promise<Object>} 更新结果
   */
  async updatePodcastData(contentId, podcastData) {
    try {
      console.log('DatabaseService: 更新播客数据', { contentId });
      
      if (!contentId || !podcastData) {
        return APIResponse.badRequest('内容ID和播客数据不能为空');
      }
      
      // 验证播客数据结构
      if (!podcastData.podcast || !podcastData.tts_podcast) {
        return APIResponse.badRequest('播客数据格式不完整', { 
          required: ['podcast', 'tts_podcast'] 
        });
      }
      
      // 确保 podcast 字段是一个对象而不是 null
      const updateData = {
        podcast: podcastData.podcast || {},
        tts_podcast: podcastData.tts_podcast,
        updated_at: new Date(),
        podcast_updated_at: new Date().toISOString(),
        status: ProcessStatus.GENERATED
      };
      
      // 使用 update 操作确保只更新指定字段，不会影响其他字段
      await this.db.collection(this.collections.EXTRACTED_CONTENTS)
        .doc(contentId)
        .update(updateData);
      
      console.log('播客数据更新成功:', contentId);
      
      return APIResponse.success({
        id: contentId,
        podcast_title: podcastData.podcast.title,
        content_count: podcastData.podcast.content.length,
        tts_podcast_format: Array.isArray(podcastData.tts_podcast) ? 
          `${podcastData.tts_podcast.length}维数组` : '非数组格式',
        status: ProcessStatus.GENERATED,
        updated_at: updateData.updated_at
      }, '播客数据更新成功');
      
    } catch (error) {
      console.error('DatabaseService: 更新播客数据失败:', error);
      return APIResponse.serverError('更新播客数据失败', error.message);
    }
  }

  /**
   * 更新TTS数据
   * @param {string} contentId - 内容记录ID
   * @param {Object} ttsData - TTS数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateTTSData(contentId, ttsData) {
    try {
      console.log('DatabaseService: 更新TTS数据', { contentId, keys: Object.keys(ttsData) });
      
      if (!contentId || !ttsData) {
        return APIResponse.badRequest('内容ID和TTS数据不能为空');
      }
      
      // 确保数组类型字段不为 null
      let updateData = {
        updated_at: new Date(),
        ...ttsData
      };
      
      // 仅对“本次传入的字段”进行规范化，未传入的字段不做任何修改，避免误清空
      const patch = { updated_at: updateData.updated_at };
      
      if (Object.prototype.hasOwnProperty.call(ttsData, 'tts_content')) {
        patch.tts_content = Array.isArray(ttsData.tts_content) ? ttsData.tts_content : [];
      }
      if (Object.prototype.hasOwnProperty.call(ttsData, 'ttsc_url')) {
        patch.ttsc_url = Array.isArray(ttsData.ttsc_url) ? ttsData.ttsc_url : [];
      }
      if (Object.prototype.hasOwnProperty.call(ttsData, 'ttsp_url')) {
        patch.ttsp_url = Array.isArray(ttsData.ttsp_url) ? ttsData.ttsp_url : [];
      }
      if (Object.prototype.hasOwnProperty.call(ttsData, 'ttsc_task')) {
        patch.ttsc_task = ttsData.ttsc_task;
      }
      if (Object.prototype.hasOwnProperty.call(ttsData, 'ttsp_task')) {
        patch.ttsp_task = ttsData.ttsp_task;
      }
      
      // 仅基于“本次传入的数据”更新状态；未传入相关数组则不改状态
      if ((Array.isArray(patch.ttsc_url) && patch.ttsc_url.length > 0) || (Array.isArray(patch.ttsp_url) && patch.ttsp_url.length > 0)) {
        patch.status = ProcessStatus.COMPLETED;
      } else if (Array.isArray(patch.tts_content) && patch.tts_content.length > 0) {
        patch.status = ProcessStatus.TTS_PROCESSING;
      }
      
      // 用 patch 替换 updateData，确保只更新本次变更字段
      updateData = patch;
      
      await this.db.collection(this.collections.EXTRACTED_CONTENTS)
        .doc(contentId)
        .update(updateData);
      
      console.log('TTS数据更新成功:', contentId);
      
      return APIResponse.success({
        id: contentId,
        status: updateData.status,
        tts_content_count: updateData.tts_content ? updateData.tts_content.length : 0,
        ttsc_url_count: updateData.ttsc_url ? updateData.ttsc_url.length : 0,
        ttsp_url_count: updateData.ttsp_url ? updateData.ttsp_url.length : 0,
        updated_at: updateData.updated_at
      }, 'TTS数据更新成功');
      
    } catch (error) {
      console.error('DatabaseService: 更新TTS数据失败:', error);
      return APIResponse.serverError('更新TTS数据失败', error.message);
    }
  }

  /**
   * 根据ID获取内容
   * @param {string} contentId - 内容ID
   * @returns {Promise<Object>} 查询结果
   */
  async getContentById(contentId) {
    try {
      if (!contentId) {
        return APIResponse.badRequest('内容ID不能为空');
      }
      
      const result = await this.db.collection(this.collections.EXTRACTED_CONTENTS)
        .doc(contentId)
        .get();
      
      // 修复：检查result.data是否为数组，并取第一个元素
      if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        return APIResponse.notFound('内容不存在');
      }
      
      // 修复：正确处理返回的数据格式
      const content = Array.isArray(result.data) ? result.data[0] : result.data;
      
      const responseData = {
        id: content._id,
        url: content.url,
        title: content.title,
        content: content.content,
        content_length: content.content_length,
        podcast: content.podcast,
        tts_podcast: content.tts_podcast,
        tts_content: content.tts_content,
        ttsc_url: content.ttsc_url,
        ttsp_url: content.ttsp_url,
        ttsc_temp_url: content.ttsc_temp_url,
        ttsp_temp_url: content.ttsp_temp_url,
        ttsc_task: content.ttsc_task,
        ttsp_task: content.ttsp_task,
        status: content.status,
        processing_stage: content.processing_stage,
        created_at: content.created_at,
        updated_at: content.updated_at
      };
      
      return APIResponse.success(responseData, '内容查询成功');
      
    } catch (error) {
      console.error('DatabaseService: 根据ID查询内容失败:', error);
      return APIResponse.serverError('查询内容失败', error.message);
    }
  }

  /**
   * 根据URL获取内容
   * @param {string} url - 网页URL
   * @returns {Promise<Object>} 查询结果
   */
  async getContentByUrl(url) {
    try {
      if (!url) {
        return APIResponse.badRequest('URL不能为空');
      }
      
      const result = await this.db.collection(this.collections.EXTRACTED_CONTENTS)
        .where({ url: url.trim() })
        .get();
      
      // 修复：检查result.data是否为数组，并取第一个元素
      if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
        return APIResponse.notFound('该URL的内容不存在');
      }
      
      // 修复：正确处理返回的数据格式
      const content = Array.isArray(result.data) ? result.data[0] : result.data;
      
      return APIResponse.success({
        id: content._id,
        url: content.url,
        title: content.title,
        content: content.content,
        content_length: content.content_length,
        podcast: content.podcast,
        tts_podcast: content.tts_podcast,
        tts_content: content.tts_content,
        ttsc_url: content.ttsc_url,
        ttsp_url: content.ttsp_url,
        ttsc_temp_url: content.ttsc_temp_url,
        ttsp_temp_url: content.ttsp_temp_url,
        ttsc_task: content.ttsc_task,
        ttsp_task: content.ttsp_task,
        status: content.status,
        processing_stage: content.processing_stage,
        created_at: content.created_at,
        updated_at: content.updated_at
      }, '内容查询成功');
      
    } catch (error) {
      console.error('DatabaseService: 根据URL查询内容失败:', error);
      return APIResponse.serverError('查询内容失败', error.message);
    }
  }

  /**
   * 获取历史记录
   * @param {number} limit - 返回记录数量限制
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 查询结果
   */
  async getHistory(limit = 10, offset = 0) {
    try {
      console.log('DatabaseService: 查询历史记录', { limit, offset });
      
      if (limit < 1 || limit > 100) {
        return APIResponse.badRequest('limit参数必须在1-100之间');
      }
      
      if (offset < 0) {
        return APIResponse.badRequest('offset参数不能为负数');
      }
      
      const result = await this.db.collection(this.collections.EXTRACTED_CONTENTS)
        .orderBy('created_at', 'desc')
        .skip(offset)
        .limit(limit)
        .get();
      
      const records = result.data.map(item => ({
        id: item._id,
        url: item.url,
        title: item.title,
        content_length: item.content_length,
        status: item.status,
        has_podcast: !!item.podcast,
        has_audio: !!(item.ttsc_url || item.ttsp_url),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      console.log(`查询到${records.length}条历史记录`);
      
      return APIResponse.success({
        records,
        pagination: {
          limit,
          offset,
          count: records.length,
          has_more: records.length === limit  // 简单判断是否有更多数据
        }
      }, '历史记录查询成功');
      
    } catch (error) {
      console.error('DatabaseService: 查询历史记录失败:', error);
      return APIResponse.serverError('查询历史记录失败', error.message);
    }
  }

  /**
   * 测试数据库连接
   * @returns {Promise<Object>} 连接测试结果
   */
  async testConnection() {
    try {
      console.log('DatabaseService: 测试数据库连接');
      
      const result = await this.db.collection(this.collections.EXTRACTED_CONTENTS)
        .limit(1)
        .get();
      
      console.log('数据库连接测试成功');
      
      return APIResponse.success({
        connected: true,
        collection: this.collections.EXTRACTED_CONTENTS,
        sample_count: result.data ? result.data.length : 0
      }, '数据库连接正常');
      
    } catch (error) {
      console.error('DatabaseService: 数据库连接测试失败:', error);
      return APIResponse.serverError('数据库连接失败', error.message);
    }
  }
}

module.exports = DatabaseService;