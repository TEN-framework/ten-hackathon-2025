/**
 * URL检测和验证工具
 * 提供URL格式验证、协议检查、域名验证等功能
 */

/**
 * 验证URL格式是否有效
 * @param {string} url - 要验证的URL
 * @returns {boolean} URL是否有效
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    // 使用URL构造函数验证URL格式
    const urlObj = new URL(url);
    
    // 检查协议是否支持
    const supportedProtocols = ['http:', 'https:'];
    if (!supportedProtocols.includes(urlObj.protocol)) {
      return false;
    }
    
    // 检查域名是否有效
    if (!urlObj.hostname) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 获取URL的详细信息
 * @param {string} url - 要分析的URL
 * @returns {Object} URL的详细信息
 */
export function parseUrl(url) {
  if (!isValidUrl(url)) {
    return null;
  }
  
  try {
    const urlObj = new URL(url);
    
    return {
      protocol: urlObj.protocol.replace(':', ''),
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin,
      fullUrl: urlObj.href
    };
  } catch (error) {
    return null;
  }
}

/**
 * 清理和规范化URL
 * @param {string} url - 要清理的URL
 * @returns {string} 清理后的URL
 */
export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  // 去除前后空格
  let normalized = url.trim();
  
  // 如果没有协议，自动添加https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  return normalized;
}

/**
 * 验证URL是否可访问（异步检查）
 * @param {string} url - 要验证的URL
 * @param {number} timeout - 超时时间（毫秒），默认5000
 * @returns {Promise<boolean>} URL是否可访问
 */
export async function isUrlAccessible(url, timeout = 5000) {
  if (!isValidUrl(url)) {
    return false;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CloudBase-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    clearTimeout(timeoutId);
    
    // 接受2xx和3xx状态码
    return response.status >= 200 && response.status < 400;
  } catch (error) {
    console.warn('URL访问性检查失败:', error);
    return false;
  }
}

/**
 * 获取URL验证结果
 * @param {string} url - 要验证的URL
 * @returns {Object} 验证结果
 */
export function validateUrl(url) {
  const normalized = normalizeUrl(url);
  const isValid = isValidUrl(normalized);
  const parsed = isValid ? parseUrl(normalized) : null;
  
  return {
    original: url,
    normalized: normalized,
    isValid: isValid,
    parsed: parsed,
    errors: !isValid ? ['URL格式不正确'] : []
  };
}

/**
 * 实时URL验证（用于输入框实时验证）
 * @param {string} url - 要验证的URL
 * @returns {Object} 实时验证结果
 */
export function validateUrlInRealTime(url) {
  if (!url || url.trim().length === 0) {
    return {
      isValid: false,
      message: '',
      level: 'info'
    };
  }
  
  // 首先检查原始URL是否包含协议
  const hasProtocol = url.startsWith('http://') || url.startsWith('https://');
  
  // 如果没有协议，先检查域名格式
  if (!hasProtocol) {
    // 简单的域名格式检查
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(url)) {
      return {
        isValid: false,
        message: '请输入有效的域名或完整URL',
        level: 'error'
      };
    }
  }
  
  const validation = validateUrl(url);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      message: 'URL格式不正确，请检查输入',
      level: 'error'
    };
  }
  
  // 检查URL长度
  if (url.length > 2048) {
    return {
      isValid: false,
      message: 'URL过长，请缩短URL',
      level: 'warning'
    };
  }
  
  // 检查是否包含常见问题
  if (url.includes(' ')) {
    return {
      isValid: false,
      message: 'URL不能包含空格',
      level: 'error'
    };
  }
  
  return {
    isValid: true,
    message: 'URL格式正确',
    level: 'success'
  };
}

export default {
  isValidUrl,
  parseUrl,
  normalizeUrl,
  isUrlAccessible,
  validateUrl,
  validateUrlInRealTime
};