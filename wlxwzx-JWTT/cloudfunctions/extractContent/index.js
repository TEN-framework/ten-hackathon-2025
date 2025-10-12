const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * 云函数：抓取网页内容并提取标题和正文
 * @param {Object} event - 云函数事件对象
 * @param {string} event.url - 要抓取的网页URL
 * @returns {Object} 包含标题和内容的对象
 */
exports.main = async (event, context) => {
  console.log('云函数开始执行，参数:', JSON.stringify(event));
  
  const { url } = event;
  
  // 参数验证
  if (!url) {
    console.log('缺少URL参数');
    return {
      success: false,
      error: '缺少URL参数'
    };
  }
  
  // URL格式验证
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    console.log('URL格式不正确:', error.message);
    return {
      success: false,
      error: 'URL格式不正确'
    };
  }
  
  try {
    console.log('开始抓取网页:', url);
    
    // 使用原生HTTP/HTTPS模块获取网页内容
    const html = await fetchHtml(parsedUrl);
    console.log('HTML获取成功，长度:', html.length);
    
    // 简单的HTML解析
    const result = parseHtml(html, url);
    
    console.log('解析完成，标题:', result.title, '内容长度:', result.content.length);
    
    return {
      success: true,
      data: {
        title: result.title,
        content: result.content,
        url: url,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('抓取网页失败:', error);
    
    let errorMessage = '抓取网页失败';
    if (error.code === 'ENOTFOUND') {
      errorMessage = '无法访问该网址，请检查URL是否正确';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = '请求超时，请稍后重试';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    };
  }
};

/**
 * 使用原生HTTP/HTTPS模块获取HTML内容
 */
function fetchHtml(parsedUrl) {
  return new Promise((resolve, reject) => {
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CloudBase-Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      timeout: 10000
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        console.log('处理重定向:', res.headers.location);
        const redirectUrl = new URL(res.headers.location, parsedUrl);
        fetchHtml(redirectUrl).then(resolve).catch(reject);
        return;
      }
      
      // 接受所有2xx状态码作为成功响应
      if (res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }
      
      console.log('HTTP响应成功，状态码:', res.statusCode);
      
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
    
    req.end();
  });
}

/**
 * 简单的HTML解析函数
 */
function parseHtml(html, url) {
  // 提取标题
  let title = '';
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }
  
  // 如果没有找到title，尝试h1标签
  if (!title) {
    const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
    if (h1Match) {
      title = h1Match[1].trim();
    }
  }
  
  if (!title) {
    title = '未找到标题';
  }
  
  // 移除HTML标签，提取文本内容
  let content = html
    // 移除script和style标签及其内容
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // 移除HTML标签
    .replace(/<[^>]+>/g, ' ')
    // 解码HTML实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    // 清理空白字符
    .replace(/\s+/g, ' ')
    .trim();
  
  // 限制内容长度
  if (content.length > 5000) {
    content = content.substring(0, 5000) + '...';
  }
  
  return {
    title: title,
    content: content
  };
}