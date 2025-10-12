#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网页内容提取器 - 功能封装类
v0.1.1功能：提取网页标题和正文内容
"""

import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse


class WebContentExtractor:
    """网页内容提取器类"""
    
    def __init__(self):
        """初始化提取器"""
        # 设置更完善的请求头，模拟真实浏览器访问
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    
    def extract_content(self, url):
        """
        提取网页内容的主方法
        
        Args:
            url (str): 网页URL
            
        Returns:
            dict: 包含提取结果的字典
        """
        # 验证URL格式
        if not self._validate_url(url):
            raise ValueError("URL格式不正确")
        
        # 提取网页内容
        result = self._extract_web_content(url)
        
        return result
    
    def _validate_url(self, url):
        """验证URL格式"""
        try:
            parsed_url = urlparse(url)
            return bool(parsed_url.scheme and parsed_url.netloc)
        except Exception:
            return False
    
    def _extract_web_content(self, url):
        """提取网页标题和正文内容"""
        try:
            # 发送HTTP请求，增加重试机制
            session = requests.Session()
            session.headers.update(self.headers)
            
            response = session.get(url, timeout=15, allow_redirects=True)
            response.raise_for_status()
            
            # 检测编码并设置正确的编码
            if response.encoding == 'ISO-8859-1':
                response.encoding = response.apparent_encoding
            
            # 使用html.parser解析器确保兼容性
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 提取标题（优化标题提取逻辑）
            title = self._extract_title(soup)
            
            # 提取正文内容
            content = self._extract_main_content(soup)
            
            # 如果内容为空，尝试备用提取方法
            if not content or len(content.strip()) < 50:
                content = self._extract_fallback_content(soup)
            
            return {
                'url': url,
                'title': title,
                'content': content,
                'content_length': len(content)
            }
            
        except requests.RequestException as e:
            raise Exception(f'网络请求失败: {str(e)}')
        except Exception as e:
            raise Exception(f'内容解析失败: {str(e)}')
    
    def _extract_main_content(self, soup):
        """提取网页正文内容"""
        # 0. 优先尝试微信公众号文章特定结构
        content = self._extract_wechat_article_content(soup)
        if content and len(content.strip()) > 100:
            return self._clean_text(content)
        
        # 1. 优先尝试智能内容识别算法
        content = self._extract_content_intelligently(soup)
        if content and len(content.strip()) > 100:
            return self._clean_text(content)
        
        # 2. 尝试常见的正文容器（优先级排序）
        content_selectors = [
            'article',
            'main',
            '.content',
            '.article-content',
            '.post-content',
            '.entry-content',
            '#content',
            '.main-content',
            'div[role="main"]',
            '.text-content',
            '.article-body',
            '.post-body',
            '.news-content',
            '.news-detail',
            '.detail-content'
        ]
        
        for selector in content_selectors:
            element = soup.select_one(selector)
            if element:
                content = self._extract_text_from_element(element)
                if len(content) > 100:
                    return self._clean_text(content)
        
        # 3. 尝试政府网站特定结构
        gov_selectors = [
            '.zw-content',
            '.article-zw',
            '.xxgk-content',
            '.gov-content',
            '.policy-content'
        ]
        
        for selector in gov_selectors:
            element = soup.select_one(selector)
            if element:
                content = self._extract_text_from_element(element)
                if len(content) > 50:
                    return self._clean_text(content)
        
        # 4. 基于段落密度算法提取
        content = self._extract_by_paragraph_density(soup)
        if content and len(content) > 100:
            return self._clean_text(content)
        
        # 5. 最后尝试body内容
        body = soup.find('body')
        if body:
            content = self._extract_text_from_element(body)
            return self._clean_text(content)
        
        return ''
    
    def _extract_content_intelligently(self, soup):
        """智能内容识别算法"""
        candidates = []
        
        # 遍历所有可能的容器元素
        for element in soup.find_all(['div', 'article', 'section', 'main']):
            # 计算文本密度
            text_length = len(element.get_text().strip())
            link_count = len(element.find_all('a'))
            
            if text_length > 200:  # 确保有足够的内容
                # 计算链接密度（链接字数/总字数）
                link_text_length = sum(len(a.get_text().strip()) for a in element.find_all('a'))
                link_density = link_text_length / text_length if text_length > 0 else 1
                
                # 文本密度高且链接密度低的元素更可能是正文
                if link_density < 0.3:  # 链接密度低于30%
                    content = self._extract_text_from_element(element)
                    if len(content) > 100:
                        candidates.append((content, text_length, link_density))
        
        # 选择文本最长且链接密度最低的候选
        if candidates:
            candidates.sort(key=lambda x: (-x[1], x[2]))  # 按文本长度降序，链接密度升序
            return candidates[0][0]
        
        return None
    
    def _extract_by_paragraph_density(self, soup):
        """基于段落密度提取内容"""
        # 查找包含多个段落的容器
        paragraphs = soup.find_all('p')
        if len(paragraphs) < 3:  # 至少需要3个段落
            return None
        
        # 按段落分组到父容器
        parent_elements = {}
        for p in paragraphs:
            parent = p.find_parent(['div', 'article', 'section'])
            if parent:
                if parent not in parent_elements:
                    parent_elements[parent] = []
                parent_elements[parent].append(p)
        
        # 选择包含最多段落的容器
        if parent_elements:
            best_parent = max(parent_elements.keys(), 
                            key=lambda x: len(parent_elements[x]))
            
            # 提取该容器中的所有文本
            content_parts = []
            for p in parent_elements[best_parent]:
                text = p.get_text().strip()
                if len(text) > 20:
                    content_parts.append(text)
            
            if content_parts:
                return ' '.join(content_parts)
        
        return None
    
    def _extract_text_from_element(self, element):
        """从元素中提取清理后的文本"""
        # 创建元素的副本以避免修改原始对象
        element_copy = BeautifulSoup(str(element), 'html.parser').find()
        
        # 清理不需要的元素
        for tag in element_copy(['script', 'style', 'nav', 'header', 'footer', 'aside', 
                               'form', 'button', 'input', 'select', 'textarea',
                               'iframe', 'noscript', 'meta', 'link']):
            tag.decompose()
        
        # 特别针对微信公众号文章清理
        # 移除微信公众号特有的干扰元素
        wechat_noise_selectors = [
            '.wx_follow_context',    # 关注公众号提示
            '.profile_area',          # 公众号信息区域
            '.rich_media_meta_list',  # 文章元信息
            '.rich_media_tool',       # 工具栏
            '.qr_code_pc_outer',      # 二维码
            '.share_media_area',      # 分享区域
            '.page_top_area',         # 顶部区域
            '.wx_follow_media'        # 关注媒体
        ]
        
        for selector in wechat_noise_selectors:
            for tag in element_copy.select(selector):
                tag.decompose()
        
        # 提取文本并清理
        text = element_copy.get_text().strip()
        return self._clean_text(text)
    
    def _extract_title(self, soup):
        """优化标题提取逻辑"""
        # 0. 优先提取微信公众号文章标题
        wechat_title = self._extract_wechat_article_title(soup)
        if wechat_title:
            return wechat_title
        
        # 1. 优先提取meta标题
        meta_title = soup.find('meta', property='og:title')
        if meta_title and meta_title.get('content'):
            title = meta_title['content'].strip()
            if title:
                return title
        
        # 2. 提取页面标题
        if soup.title:
            title = soup.title.get_text().strip()
            if title:
                # 清理标题中的网站名称等无关信息
                title = self._clean_title(title)
                return title
        
        # 3. 尝试h1标题
        h1 = soup.find('h1')
        if h1:
            title = h1.get_text().strip()
            if title:
                title = self._clean_title(title)
                return title
        
        return ''
    
    def _extract_wechat_article_title(self, soup):
        """提取微信公众号文章标题"""
        # 1. 尝试微信公众号特定的标题选择器
        wechat_selectors = [
            '.rich_media_title',  # 微信公众号文章标题
            'h1.rich_media_title',
            '#activity-name',     # 微信公众号文章标题
            '.article-title',
            '.post-title'
        ]
        
        for selector in wechat_selectors:
            element = soup.select_one(selector)
            if element:
                title = element.get_text().strip()
                if title:
                    return title
        
        # 2. 尝试meta标签中的微信公众号标题
        meta_title = soup.find('meta', property='og:title')
        if meta_title and meta_title.get('content'):
            title = meta_title['content'].strip()
            # 检查是否是微信公众号文章（包含特定关键词）
            if title and ('微信' in title or '公众号' in title or 'mp.weixin.qq.com' in str(soup)):
                return title
        
        return None
    
    def _extract_wechat_content_from_meta(self, soup):
        """从meta标签中提取微信公众号文章内容"""
        # 尝试从多个meta标签中提取文章内容
        meta_selectors = [
            ('meta', {'name': 'description'}),
            ('meta', {'property': 'og:description'}),
            ('meta', {'property': 'twitter:description'}),
            ('meta', {'name': 'keywords'}),
        ]
        
        for tag_name, attrs in meta_selectors:
            meta_tag = soup.find(tag_name, attrs)
            if meta_tag and meta_tag.get('content'):
                content = meta_tag['content'].strip()
                # 检查内容是否包含文章正文（排除简短描述）
                if len(content) > 100 and '1.' in content and '2.' in content:
                    return content
        
        return None
    
    def _extract_wechat_content_from_js(self, soup):
        """从JavaScript变量中提取微信公众号文章内容"""
        import re
        
        # 查找包含文章内容的JavaScript变量
        script_tags = soup.find_all('script')
        
        for script in script_tags:
            script_content = script.string
            if not script_content:
                continue
            
            # 查找window.__QMTPL_SSR_DATA__对象中的desc字段
            pattern1 = r'window\.__QMTPL_SSR_DATA__\s*=\s*{[^}]*"desc"\s*:\s*"([^"]+)"'
            match1 = re.search(pattern1, script_content)
            if match1:
                content = match1.group(1)
                # 解码可能的转义字符
                content = content.encode().decode('unicode_escape')
                if len(content) > 100 and '1.' in content and '2.' in content:
                    return content
            
            # 查找其他可能的JavaScript变量赋值
            patterns = [
                r'var\s+desc\s*=\s*"([^"]+)"',
                r'const\s+desc\s*=\s*"([^"]+)"',
                r'let\s+desc\s*=\s*"([^"]+)"',
                r'desc\s*:\s*"([^"]+)"',
                r'content\s*:\s*"([^"]+)"',
                r'articleContent\s*:\s*"([^"]+)"',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, script_content)
                if match:
                    content = match.group(1)
                    # 解码可能的转义字符
                    content = content.encode().decode('unicode_escape')
                    if len(content) > 100 and '1.' in content and '2.' in content:
                        return content
        
        return None
    
    def _extract_wechat_article_content(self, soup):
        """提取微信公众号文章正文内容"""
        # 步骤1：从meta标签提取（description、og:description、twitter:description）
        meta_content = self._extract_wechat_content_from_meta(soup)
        if meta_content and len(meta_content.strip()) > 50:
            return self._clean_text(meta_content)
        
        # 步骤2：从JavaScript变量中提取
        js_content = self._extract_wechat_content_from_js(soup)
        if js_content and len(js_content.strip()) > 50:
            return self._clean_text(js_content)
        
        # 步骤3：优先提取 #js_content 中的内容（这是微信公众号文章的主要内容区域）
        js_content = soup.select_one('#js_content')
        if js_content:
            content = self._extract_wechat_text_from_element(js_content)
            if len(content) > 100:  # 确保有足够的内容
                return content
        
        # 步骤4：提取 js_image_desc 中的内容
        image_desc = soup.select_one('#js_image_desc')
        if image_desc:
            content = self._extract_wechat_text_from_element(image_desc)
            if len(content) > 100:  # 确保有足够的内容
                return content
        
        # 步骤5：尝试微信公众号特定的内容选择器
        wechat_content_selectors = [
            '.share_notice',                  # 分享通知内容
            '.js_underline_content',          # 下划线内容
            '.rich_media_content',            # 微信公众号文章内容
            '#js_image_content',              # 微信公众号图片内容区域
            '.image_content',                 # 图片内容区域
            '.rich_media_area_primary',       # 微信公众号主要内容区域
            '#js_article_content',           # 微信公众号文章内容容器
            '.article-content',
            '.post-content'
        ]
        
        for selector in wechat_content_selectors:
            element = soup.select_one(selector)
            if element:
                # 特别针对微信公众号文章结构优化提取
                content = self._extract_wechat_text_from_element(element)
                if len(content) > 100:
                    return content
        
        # 步骤6：尝试查找包含大量文本的元素
        text_elements = soup.find_all(['p', 'div', 'span'])
        for element in text_elements:
            text = self._extract_wechat_text_from_element(element)
            if len(text) > 200 and not self._is_wechat_noise_text(text):
                # 检查文本质量：包含中文字符
                import re
                chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
                if chinese_chars > 50:  # 确保有足够的中文内容
                    return text
        
        # 步骤7：回退方法
        return self._extract_fallback_content(soup)
    
    def _extract_wechat_text_from_element(self, element):
        """针对微信公众号文章优化的文本提取方法"""
        # 创建元素的副本以避免修改原始对象
        element_copy = BeautifulSoup(str(element), 'html.parser').find()
        
        # 特别针对微信公众号文章清理
        # 移除微信公众号特有的干扰元素
        wechat_noise_selectors = [
            '.wx_follow_context',    # 关注公众号提示
            '.profile_area',          # 公众号信息区域
            '.rich_media_meta_list',  # 文章元信息
            '.rich_media_tool',       # 工具栏
            '.qr_code_pc_outer',     # 二维码
            '.share_media_area',     # 分享区域
            '.page_top_area',        # 顶部区域
            '.wx_follow_media',      # 关注媒体
            '.album_con',            # 专辑信息
            '.rich_media_tool',      # 工具栏
            '.end_poi_area',         # 结束区域
            '.publish_source',       # 发布来源
            '.rich_media_meta_list',  # 元信息列表
            '.wx_shoptag_area',       # 商店标签区域
            '.wx_shopprofile_area',   # 商店资料区域
            '.wx_live_area',          # 直播区域
            '.weui-half-screen-dialog', # 半屏对话框
            '.reward_dialog',         # 赞赏对话框
            '.discuss_more_dialog_wrp', # 讨论对话框
            '.author_profile-info',  # 作者信息
            '.author_profile-pay_area', # 支付区域
            '.dialog-pay',            # 支付对话框
            '.reward-slider-container', # 赞赏滑块
            '.album_tag_context',     # 专辑标签
            '.policy_tips',           # 政策提示
            '.claim_source_block',     # 来源声明
            'script',                 # 脚本元素
            'style',                  # 样式元素
            'noscript'                # noscript元素
        ]
        
        for selector in wechat_noise_selectors:
            for tag in element_copy.select(selector):
                tag.decompose()
        
        # 清理不需要的元素
        for tag in element_copy(['nav', 'header', 'footer', 'aside', 
                               'form', 'button', 'input', 'select', 'textarea',
                               'iframe', 'meta', 'link']):
            tag.decompose()
        
        # 提取文本并清理
        text = element_copy.get_text().strip()
        
        # 特别清理JavaScript代码和脚本内容
        import re
        # 移除JavaScript函数定义
        text = re.sub(r'function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}', '', text)
        # 移除变量声明
        text = re.sub(r'var\s+\w+\s*=\s*[^;]+;', '', text)
        # 移除const/let声明
        text = re.sub(r'(const|let)\s+\w+\s*=\s*[^;]+;', '', text)
        # 移除对象字面量
        text = re.sub(r'\{[^{}]*\}', '', text)
        # 移除数组字面量
        text = re.sub(r'\[[^\]]*\]', '', text)
        
        return self._clean_text(text)
    
    def _is_wechat_noise_text(self, text):
        """判断是否为微信公众号干扰文本"""
        import re
        
        wechat_noise_patterns = [
            r'关注[\w\s]*公众号',
            r'微信[\w\s]*扫一扫',
            r'点击[\w\s]*关注',
            r'长按[\w\s]*识别',
            r'阅读原文',
            r'查看[\w\s]*原文',
            r'分享[\w\s]*朋友圈',
            r'收藏[\w\s]*点赞',
            r'在看',
            r'赞赏',
            r'打赏',
            r'本文[\w\s]*转载',
            r'来源[\w\s]*网络',
            r'如有侵权[\w\s]*联系',
            r'商务合作',
            r'联系我们',
            r'投稿',
            r'广告',
            r'向上滑动看下一个',
            r'知道了',
            r'可打开此内容',
            r'使用完整服务',
            r'视频',
            r'小程序',
            r'赞',
            r'轻点两下取消赞',
            r'轻点两下取消',
            r'分享',
            r'留言',
            r'收藏',
            r'听过'
        ]
        
        for pattern in wechat_noise_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        
        # 检查文本长度和内容质量
        if len(text) < 20:  # 太短的文本
            return True
        
        # 检查是否主要是标点符号或数字
        if re.match(r'^[\\s\\d\\p{P}]+$', text):
            return True
        
        return False
    
    def _clean_title(self, title):
        """清理标题中的无关信息"""
        # 常见的网站名称分隔符
        separators = [' - ', ' | ', ' _ ', ' » ', ' › ', ' :: ']
        
        for sep in separators:
            if sep in title:
                parts = title.split(sep)
                # 通常主要内容在前面的部分
                if len(parts) > 1:
                    # 选择最长或第一个非空部分
                    main_part = parts[0].strip()
                    if len(main_part) > 10:  # 确保有足够的内容
                        return main_part
        
        return title
    
    def _extract_fallback_content(self, soup):
        """备用内容提取方法"""
        # 方法1: 基于文本块提取
        text_blocks = []
        
        # 查找所有包含文本的块级元素
        for element in soup.find_all(['div', 'p', 'span', 'td']):
            text = element.get_text().strip()
            if len(text) > 50:  # 过滤掉太短的文本
                # 计算文本质量（链接密度、标点符号比例等）
                link_count = len(element.find_all('a'))
                text_length = len(text)
                
                # 链接密度低于40%且文本长度合理
                if link_count / (text_length / 100) < 40:
                    text_blocks.append(text)
        
        if text_blocks:
            # 按长度排序，选择最长的文本块
            text_blocks.sort(key=len, reverse=True)
            return self._clean_text(' '.join(text_blocks[:3]))  # 取前3个最长的文本块
        
        # 方法2: 基于列表项提取
        list_items = []
        for li in soup.find_all(['li', 'dd', 'dt']):
            text = li.get_text().strip()
            if len(text) > 20:
                list_items.append(text)
        
        if list_items:
            return self._clean_text(' '.join(list_items))
        
        # 方法3: 提取所有文本并过滤
        all_text = soup.get_text()
        # 分割成句子，过滤掉太短的句子
        import re
        sentences = re.split(r'[.!?。！？]', all_text)
        valid_sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
        
        if valid_sentences:
            return self._clean_text('. '.join(valid_sentences))
        
        return ''
    
    def _clean_text(self, text):
        """清理文本内容，特别针对微信公众号文章优化"""
        import re
        
        # 0. 处理转义字符，将\x0a转换为换行符
        text = text.replace('\\x0a', '\n')
        
        # 1. 替换多个空白字符为单个空格
        text = re.sub(r'\s+', ' ', text)
        
        # 2. 去除首尾空白
        text = text.strip()
        
        # 3. 特别针对微信公众号文章的清理
        # 移除常见的微信公众号干扰文本
        wechat_noise_patterns = [
            r'关注[\w\s]*公众号',           # 关注公众号相关文本
            r'微信[\w\s]*扫一扫',           # 微信扫一扫
            r'点击[\w\s]*关注',             # 点击关注
            r'长按[\w\s]*识别',             # 长按识别
            r'阅读原文',                     # 阅读原文
            r'查看[\w\s]*原文',             # 查看原文
            r'分享[\w\s]*朋友圈',           # 分享朋友圈
            r'收藏[\w\s]*点赞',             # 收藏点赞
            r'在看',                         # 在看
            r'赞赏',                         # 赞赏
            r'打赏',                         # 打赏
            r'本文[\w\s]*转载',             # 转载声明
            r'来源[\w\s]*网络',             # 来源网络
            r'如有侵权[\w\s]*联系',         # 侵权声明
            r'商务合作',                     # 商务合作
            r'联系我们',                     # 联系我们
            r'投稿',                         # 投稿
            r'广告',                         # 广告
        ]
        
        for pattern in wechat_noise_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)
        
        # 4. 清理重复的标点符号
        text = re.sub(r'[。！？]{2,}', '。', text)  # 多个句号合并为一个
        text = re.sub(r'[，、]{2,}', '，', text)    # 多个逗号合并为一个
        
        # 5. 清理URL链接
        text = re.sub(r'https?://[^\s]+', '', text)
        
        # 6. 清理邮箱地址
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '', text)
        
        # 7. 再次替换多个空白字符为单个空格
        text = re.sub(r'\s+', ' ', text)
        
        # 8. 去除首尾空白
        text = text.strip()
        
        return text