#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PodcastGeneratorService 配置文件
"""

# 通义千问API配置
QWEN_API_CONFIG = {
    # API基础URL
    'BASE_URL': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    
    # API密钥
    'API_KEY': 'sk-2126cb95302b4e0896d79e2ebd11858b',
    
    # 请求超时时间（秒）
    'TIMEOUT': 60,
    
    # 最大重试次数
    'MAX_RETRIES': 2,
    
    # 重试延迟（秒）
    'RETRY_DELAY': 2,
    
    # 模型名称
    'MODEL_NAME': 'qwen-flash-2025-07-28',
    
    # 最大输出Token数
    'MAX_TOKENS': 2000,
    
    # 温度参数（控制创造性）
    'TEMPERATURE': 0.7,
    
    # 最大内容长度（字符）
    'MAX_CONTENT_LENGTH': 30000
}

# 播客生成配置
PODCAST_CONFIG = {
    # 默认播客风格
    'DEFAULT_STYLE': '科普风格',
    
    # 支持的播客风格
    'SUPPORTED_STYLES': [
        '科普风格',
        '新闻播报风格',
        '访谈对话风格',
        '故事叙述风格',
        '教育解说风格'
    ],
    
    # 系统提示词模板
    'SYSTEM_PROMPT_TEMPLATE': """你是位资深播客编辑，请将以下
标题：{title}
内容：{content}
编写男女双人讨论形式的播客稿

要求：
- 播客稿直接输出对话内容，不需要其他描述和男女对话者的性别身份等信息
- 对话内容要自然流畅，符合播客节目的风格
- 内容要忠实于原文，但可以适当口语化
- 男女对话要交替进行，体现双人讨论的特点

输出格式要求：
{{
  "title": "{title}",
  "content": [
    "hi，你好呀，欢迎收听本期的讲我听听",
    "我们今天要讲的是......"
  ]
}}

请严格按照这个JSON格式输出，不要包含其他内容。""",
    
    # 最小对话条数
    'MIN_CONTENT_ITEMS': 2,
    
    # 最大对话条数
    'MAX_CONTENT_ITEMS': 50,
    
    # 单条对话最大长度
    'MAX_ITEM_LENGTH': 200
}

# TTS拆分配置
TTS_SPLIT_CONFIG = {
    # 男声对应的索引（偶数）
    'MALE_VOICE_INDICES': 'even',  # 0, 2, 4, 6...
    
    # 女声对应的索引（奇数）
    'FEMALE_VOICE_INDICES': 'odd',  # 1, 3, 5, 7...
    
    # 最小分组大小
    'MIN_GROUP_SIZE': 1,
    
    # 最大分组大小
    'MAX_GROUP_SIZE': 100,
    
    # 文本优化选项
    'TEXT_OPTIMIZATION': {
        'remove_empty': True,        # 移除空内容
        'trim_whitespace': True,     # 去除首尾空白
        'normalize_punctuation': True, # 标点符号规范化
        'max_length_per_item': 500   # 单项最大长度
    }
}

# 数据库配置
DATABASE_CONFIG = {
    # 集合名称
    'COLLECTION_NAME': 'extracted_contents',
    
    # 查询超时时间（秒）
    'QUERY_TIMEOUT': 10,
    
    # 更新字段
    'UPDATE_FIELDS': {
        'podcast': 'podcast',
        'tts_podcast': 'tts_podcast',
        'updated_at': 'updated_at',
        'podcast_updated_at': 'podcast_updated_at',
        'status': 'status'
    }
}

# 错误处理配置
ERROR_CONFIG = {
    # 最大错误重试次数
    'MAX_ERROR_RETRIES': 2,
    
    # 错误重试延迟（秒）
    'ERROR_RETRY_DELAY': 1,
    
    # 是否记录详细错误信息
    'LOG_DETAILED_ERRORS': True,
    
    # 常见错误码映射
    'ERROR_CODE_MAPPING': {
        'invalid_content_id': 400,
        'content_not_found': 404,
        'api_request_failed': 502,
        'api_response_invalid': 422,
        'json_parse_error': 422,
        'database_error': 500,
        'unknown_error': 500
    }
}

# 日志配置
LOGGING_CONFIG = {
    # 日志级别
    'LEVEL': 'INFO',
    
    # 是否输出详细信息
    'VERBOSE': True,
    
    # 最大日志长度
    'MAX_LOG_LENGTH': 1000,
    
    # 是否记录API请求详情
    'LOG_API_REQUESTS': True,
    
    # 是否记录处理时间
    'LOG_PROCESSING_TIME': True
}