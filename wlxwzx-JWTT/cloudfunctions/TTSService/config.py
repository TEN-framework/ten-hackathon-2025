#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TTSService 配置文件
"""

# TTS配置
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
        '"': '"',   # 左双引号
        '"': '"',   # 右双引号
        "'": "'",   # 左单引号
        "'": "'",   # 右单引号
    }
}

# 音频配置
AUDIO_CONFIG = {
    # 音频格式（官方支持wav格式）
    'FORMAT': 'wav',
    
    # 采样率（官方固定24kHz）
    'SAMPLE_RATE': 24000,
    
    # 音频质量
    'QUALITY': 'high',
    
    # 默认男声（官方音色）
    'DEFAULT_MALE_VOICE': 'Ethan',  # 晨煦
    
    # 默认女声（官方音色）
    'DEFAULT_FEMALE_VOICE': 'Cherry',  # 芊悦
    
    # 默认语言类型
    'DEFAULT_LANGUAGE': 'Chinese',
    
    # 音频URL有效期（24小时）
    'URL_EXPIRES_HOURS': 24
}

# 数据库配置
DATABASE_CONFIG = {
    # 集合名称
    'COLLECTION_NAME': 'extracted_contents',
    
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