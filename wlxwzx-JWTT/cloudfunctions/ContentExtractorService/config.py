#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ContentExtractorService 配置文件
"""

# 网页提取配置
EXTRACTION_CONFIG = {
    # 请求超时时间（秒）
    'REQUEST_TIMEOUT': 30,
    
    # 最大重试次数
    'MAX_RETRIES': 3,
    
    # 重试延迟（秒）
    'RETRY_DELAY': 2,
    
    # 最大内容长度（字符）
    'MAX_CONTENT_LENGTH': 100000,
    
    # User-Agent
    'USER_AGENT': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    
    # 请求头
    'DEFAULT_HEADERS': {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
    }
}

# TTS文本分段配置
TTS_CONFIG = {
    # 最大分段长度（字符）
    'MAX_SEGMENT_LENGTH': 500,
    
    # 最小分段长度（字符）
    'MIN_SEGMENT_LENGTH': 50,
    
    # 分段分隔符优先级（按优先级排序）
    'SEGMENT_SEPARATORS': [
        '。', '！', '？',  # 句号优先
        '；', '：',        # 分号冒号次之
        '，', '、',        # 逗号顿号
        '\n', '\r\n',     # 换行符
        ' ', '\t'         # 空格制表符
    ],
    
    # 需要清理的字符
    'CLEANUP_CHARS': [
        '\r', '\t', '\xa0',  # 特殊空白字符
        '​', '‌', '‍',         # 零宽字符
        '﻿',                  # BOM字符
    ],
    
    # 需要规范化的标点符号
    'PUNCTUATION_NORMALIZE': {
        '，': '，',  # 全角逗号
        '。': '。',  # 全角句号
        '？': '？',  # 全角问号
        '！': '！',  # 全角感叹号
        '：': '：',  # 全角冒号
        '；': '；',  # 全角分号
        '“': '“',   # 左双引号
        '”': '”',   # 右双引号
        '‘': '‘',   # 左单引号
        '’': '’',   # 右单引号
    }
}

# 内容清洗配置
CONTENT_CLEANUP_CONFIG = {
    # 需要移除的HTML标签
    'REMOVE_TAGS': [
        'script', 'style', 'noscript', 'iframe', 'embed', 'object',
        'form', 'input', 'button', 'textarea', 'select',
        'nav', 'header', 'footer', 'aside', 'menu'
    ],
    
    # 需要保留的HTML标签
    'KEEP_TAGS': [
        'p', 'div', 'span', 'article', 'section', 'main',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'pre'
    ],
    
    # 最小段落长度
    'MIN_PARAGRAPH_LENGTH': 20,
    
    # 最大段落长度
    'MAX_PARAGRAPH_LENGTH': 5000,
    
    # 需要移除的CSS选择器
    'REMOVE_SELECTORS': [
        '.ad', '.advertisement', '.banner',
        '.sidebar', '.comment', '.footer',
        '.navigation', '.menu', '.social',
        '[class*="ad-"]', '[id*="ad-"]',
        '[class*="advertisement"]', '[id*="advertisement"]'
    ]
}

# 数据库配置
DATABASE_CONFIG = {
    # 集合名称
    'COLLECTION_NAME': 'extracted_contents',
    
    # 批量操作大小
    'BATCH_SIZE': 20,
    
    # 查询超时时间（秒）
    'QUERY_TIMEOUT': 10
}

# 日志配置
LOGGING_CONFIG = {
    # 日志级别
    'LEVEL': 'INFO',
    
    # 是否输出详细信息
    'VERBOSE': True,
    
    # 最大日志长度
    'MAX_LOG_LENGTH': 1000
}

# 错误处理配置
ERROR_CONFIG = {
    # 最大错误重试次数
    'MAX_ERROR_RETRIES': 2,
    
    # 错误重试延迟（秒）
    'ERROR_RETRY_DELAY': 1,
    
    # 是否记录详细错误信息
    'LOG_DETAILED_ERRORS': True
}