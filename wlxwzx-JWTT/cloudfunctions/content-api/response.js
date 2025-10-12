/**
 * 统一响应格式工具类
 * 标准化所有API响应格式
 */

/**
 * 处理状态枚举
 */
const ProcessStatus = {
  PENDING: 'pending',              // 待处理
  EXTRACTING: 'extracting',        // 内容提取中
  EXTRACTED: 'extracted',          // 内容提取完成
  GENERATING: 'generating',        // 播客生成中
  GENERATED: 'generated',          // 播客生成完成
  TTS_PROCESSING: 'tts_processing',// TTS处理中
  COMPLETED: 'completed',          // 全部完成
  ERROR: 'error'                   // 处理错误
};

/**
 * 生成请求追踪ID
 * @returns {string} 唯一的请求ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 标准API响应类
 */
class APIResponse {
  /**
   * 创建成功响应
   * @param {any} data - 响应数据
   * @param {string} message - 响应消息
   * @param {string} requestId - 请求追踪ID
   * @returns {Object} 标准响应对象
   */
  static success(data = null, message = '操作成功', requestId = null) {
    return {
      code: 200,
      message,
      data,
      request_id: requestId || generateRequestId(),
      timestamp: Date.now(),
      success: true
    };
  }

  /**
   * 创建错误响应
   * @param {string} message - 错误消息
   * @param {number} code - 错误代码
   * @param {any} details - 错误详情
   * @param {string} requestId - 请求追踪ID
   * @returns {Object} 标准错误响应对象
   */
  static error(message = '操作失败', code = 500, details = null, requestId = null) {
    return {
      code,
      message,
      data: null,
      error: {
        message,
        details,
        code
      },
      request_id: requestId || generateRequestId(),
      timestamp: Date.now(),
      success: false
    };
  }

  /**
   * 创建客户端错误响应
   * @param {string} message - 错误消息
   * @param {any} details - 错误详情
   * @param {string} requestId - 请求追踪ID
   * @returns {Object} 400错误响应
   */
  static badRequest(message = '请求参数错误', details = null, requestId = null) {
    return this.error(message, 400, details, requestId);
  }

  /**
   * 创建未找到错误响应
   * @param {string} message - 错误消息
   * @param {any} details - 错误详情
   * @param {string} requestId - 请求追踪ID
   * @returns {Object} 404错误响应
   */
  static notFound(message = '资源未找到', details = null, requestId = null) {
    return this.error(message, 404, details, requestId);
  }

  /**
   * 创建服务器内部错误响应
   * @param {string} message - 错误消息
   * @param {any} details - 错误详情
   * @param {string} requestId - 请求追踪ID
   * @returns {Object} 500错误响应
   */
  static serverError(message = '服务器内部错误', details = null, requestId = null) {
    return this.error(message, 500, details, requestId);
  }

  /**
   * 创建处理中响应
   * @param {string} taskId - 任务ID
   * @param {string} status - 处理状态
   * @param {string} message - 状态消息
   * @param {string} requestId - 请求追踪ID
   * @returns {Object} 处理中响应
   */
  static processing(taskId, status = ProcessStatus.PENDING, message = '任务处理中', requestId = null) {
    return {
      code: 202,
      message,
      data: {
        task_id: taskId,
        status: status,
        processing: true
      },
      request_id: requestId || generateRequestId(),
      timestamp: Date.now(),
      success: true
    };
  }
}

/**
 * HTTP状态码映射
 */
const HTTPStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

/**
 * 内容记录数据模型验证
 */
class ContentModel {
  /**
   * 验证内容记录数据
   * @param {Object} data - 内容数据
   * @returns {Object} 验证结果
   */
  static validate(data) {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('数据不能为空且必须是对象');
      return { valid: false, errors };
    }
    
    // 必填字段验证
    const requiredFields = ['url', 'title', 'content'];
    requiredFields.forEach(field => {
      if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
        errors.push(`${field}字段不能为空`);
      }
    });
    
    // URL格式验证
    if (data.url) {
      try {
        new URL(data.url);
      } catch (e) {
        errors.push('URL格式不正确');
      }
    }
    
    // 内容长度验证
    if (data.content && data.content.length > 100000) {
      errors.push('内容长度不能超过100000字符');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 标准化内容记录数据
   * @param {Object} data - 原始数据
   * @returns {Object} 标准化后的数据
   */
  static normalize(data) {
    const now = new Date();
    
    return {
      _id: data._id || undefined,
      _openid: data._openid || 'anonymous', // 添加_openid字段支持
      url: data.url?.trim() || '',
      title: data.title?.trim() || '',
      content: data.content?.trim() || '',
      content_length: data.content ? data.content.length : 0,
      
      // 播客相关 - 确保对象类型字段不为 null
      podcast: data.podcast || {},
      tts_podcast: data.tts_podcast || [],  // 数组类型字段默认值为 []
      
      // 音频相关 - 确保数组类型字段不为 null
      tts_content: data.tts_content || [],
      ttsc_url: data.ttsc_url || [],
      ttsp_url: data.ttsp_url || [],
      
      // 状态管理
      status: data.status || ProcessStatus.PENDING,
      processing_stage: data.processing_stage || 'created',
      
      // 元数据
      created_at: data.created_at || now,
      updated_at: now,
      timestamp: data.timestamp || now.toISOString()
    };
  }
}

module.exports = {
  APIResponse,
  ProcessStatus,
  HTTPStatus,
  ContentModel,
  generateRequestId
};