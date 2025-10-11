/**
 * OpenAI兼容客户端工具
 * 用于调用通义千问大模型生成播客稿
 */

// API配置
const API_CONFIG = {
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: 'sk-2126cb95302b4e0896d79e2ebd11858b',
  timeout: 60000, // 60秒超时（增加到60秒）
  maxRetries: 2,  // 减少重试次数避免过长等待
  retryDelay: 2000 // 重试延迟2秒
};

/**
 * 构建系统提示词
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @returns {string} 系统提示词
 */
const buildSystemPrompt = (title, content) => {
  return `你是位资深播客编辑，请将以下
标题：${title}
内容：${content}
编写男女双人讨论形式的播客稿

要求：
- 播客稿直接输出对话内容，不需要其他描述和男女对话者的性别身份等信息
- 对话内容要自然流畅，符合播客节目的风格
- 内容要忠实于原文，但可以适当口语化
- 男女对话要交替进行，体现双人讨论的特点

输出格式要求：
{
  "title": "${title}",
  "content": [
    "hi，你好呀，欢迎收听本期的讲我听听",
    "我们今天要讲的是......"
  ]
}

请严格按照这个JSON格式输出，不要包含其他内容。`;
};

/**
 * 发送API请求
 * @param {Object} requestData - 请求数据
 * @param {number} retryCount - 当前重试次数
 * @returns {Promise<Object>} API响应数据
 */
const sendAPIRequest = async (requestData, retryCount = 0) => {
  let timeoutId;
  
  try {
    // 创建超时控制器
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    
    const response = await fetch(`${API_CONFIG.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });

    // 清除超时定时器
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // 检查API响应是否包含错误
    if (data.error) {
      throw new Error(`API返回错误: ${data.error.message || '未知错误'}`);
    }

    return data;

  } catch (error) {
    // 清除超时定时器（如果存在）
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // 如果是网络错误或超时，进行重试
    if (retryCount < API_CONFIG.maxRetries && 
        (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('网络'))) {
      console.warn(`API请求失败，第${retryCount + 1}次重试...`, error.message);
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1))); // 递增延迟
      return sendAPIRequest(requestData, retryCount + 1);
    }
    
    // 特殊处理用户中止错误
    if (error.name === 'AbortError') {
      throw new Error('请求超时，请尝试缩短内容长度或稍后重试');
    }
    
    throw error;
  }
};

/**
 * 解析API响应内容
 * @param {string} content - API返回的内容
 * @returns {Object} 解析后的播客稿对象
 */
const parsePodcastContent = (content) => {
  try {
    // 尝试直接解析JSON
    const parsed = JSON.parse(content);
    
    // 验证必需字段
    if (!parsed.title || !Array.isArray(parsed.content)) {
      throw new Error('API响应格式不正确');
    }
    
    // 验证内容数组
    if (parsed.content.length === 0) {
      throw new Error('播客内容不能为空');
    }
    
    // 过滤空内容
    parsed.content = parsed.content.filter(item => 
      item && typeof item === 'string' && item.trim().length > 0
    );
    
    return parsed;
    
  } catch (parseError) {
    console.error('解析API响应失败:', parseError);
    
    // 如果解析失败，尝试从文本中提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        // 继续抛出原始错误
      }
    }
    
    throw new Error('无法解析播客稿内容，请检查API响应格式');
  }
};

/**
 * 生成播客稿
 * @param {string} title - 文章标题
 * @param {string} content - 文章内容
 * @param {string} style - 播客风格，默认为"科普风格"
 * @returns {Promise<Object>} 播客稿对象
 */
export const generatePodcast = async (title, content, style = '科普风格') => {
  // 参数验证
  if (!title || !content) {
    throw new Error('标题和内容不能为空');
  }
  
  if (typeof title !== 'string' || typeof content !== 'string') {
    throw new Error('标题和内容必须是字符串');
  }
  
  // 内容长度检查和截断
  const maxContentLength = 30000; // 限制内容长度避免超时
  if (content.length > maxContentLength) {
    console.warn(`内容过长(${content.length}字符)，将截断到${maxContentLength}字符`);
    content = content.substring(0, maxContentLength) + '...';
  }
  
  // 构建请求数据
  const requestData = {
    model: 'qwen-plus',
    messages: [
      {
        role: 'system',
        content: buildSystemPrompt(title, content)
      },
      {
        role: 'user',
        content: `请用${style}编写`
      }
    ],
    temperature: 0.7, // 控制创造性
    max_tokens: 2000,  // 最大输出长度
    stream: false      // 非流式输出
  };

  try {
    console.log('开始调用通义千问API生成播客稿...');
    
    const response = await sendAPIRequest(requestData);
    
    if (!response.choices || response.choices.length === 0) {
      throw new Error('API返回空结果');
    }
    
    const message = response.choices[0].message;
    if (!message || !message.content) {
      throw new Error('API返回内容为空');
    }
    
    // 解析播客稿内容
    const podcast = parsePodcastContent(message.content);
    
    console.log('播客稿生成成功:', podcast);
    return podcast;
    
  } catch (error) {
    console.error('生成播客稿失败:', error);
    
    // 提供更友好的错误信息
    let errorMessage = '生成播客稿失败';
    if (error.message.includes('网络') || error.message.includes('超时')) {
      errorMessage = '网络连接失败，请检查网络后重试';
    } else if (error.message.includes('API')) {
      errorMessage = 'AI服务暂时不可用，请稍后重试';
    } else if (error.message.includes('格式')) {
      errorMessage = '内容格式处理失败，请尝试重新生成';
    }
    
    throw new Error(`${errorMessage}: ${error.message}`);
  }
};

/**
 * 测试API连接
 * @returns {Promise<boolean>} 连接是否成功
 */
export const testAPIConnection = async () => {
  try {
    const testData = {
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: '你是一个测试助手，请回复"连接成功"'
        },
        {
          role: 'user',
          content: '测试连接'
        }
      ],
      max_tokens: 10
    };
    
    const response = await sendAPIRequest(testData);
    return response.choices && response.choices.length > 0;
    
  } catch (error) {
    console.error('API连接测试失败:', error);
    return false;
  }
};

// 默认导出
export default {
  generatePodcast,
  testAPIConnection,
  API_CONFIG
};