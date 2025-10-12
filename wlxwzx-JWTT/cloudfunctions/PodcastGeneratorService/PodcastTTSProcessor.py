#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
播客TTS处理器
负责将播客内容拆分为TTS格式（单双索引分组）
"""

import re
from typing import List, Dict, Any, Tuple
from config import TTS_SPLIT_CONFIG, LOGGING_CONFIG


class PodcastTTSProcessor:
    """播客TTS处理器类"""
    
    def __init__(self):
        self.male_indices = TTS_SPLIT_CONFIG['MALE_VOICE_INDICES']
        self.female_indices = TTS_SPLIT_CONFIG['FEMALE_VOICE_INDICES']
        self.min_group_size = TTS_SPLIT_CONFIG['MIN_GROUP_SIZE']
        self.max_group_size = TTS_SPLIT_CONFIG['MAX_GROUP_SIZE']
        self.text_optimization = TTS_SPLIT_CONFIG['TEXT_OPTIMIZATION']
        self.verbose = LOGGING_CONFIG['VERBOSE']
    
    def process_podcast_for_tts(self, podcast_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        播客内容TTS处理
        按v0.5.2需求，将content数组拆分为单双两组
        
        Args:
            podcast_data: AI生成的播客数据，格式如：
                         {
                           "title": "播客标题",
                           "content": ["对话1", "对话2", "对话3", ...]
                         }
            
        Returns:
            Dict: 处理后的TTS数据，格式为：
                 {
                   "success": True,
                   "data": {
                     "tts_podcast": [[男声内容], [女声内容]],
                     "statistics": {...}
                   }
                 }
        """
        try:
            if self.verbose:
                print("开始播客TTS拆分处理...")
            
            # 1. 验证输入数据
            validation_result = self._validate_podcast_data(podcast_data)
            if not validation_result['valid']:
                return self._create_error_response(
                    400,
                    "播客数据验证失败",
                    validation_result['errors']
                )
            
            content_array = podcast_data['content']
            
            # 2. 文本优化处理
            optimized_content = self._optimize_content_array(content_array)
            if self.verbose:
                print(f"内容优化完成：{len(content_array)} -> {len(optimized_content)}项")
            
            # 3. 按单双索引拆分
            male_content, female_content = self._split_by_index(optimized_content)
            
            # 4. 后处理优化
            male_content = self._post_process_content_group(male_content, "男声")
            female_content = self._post_process_content_group(female_content, "女声")
            
            # 5. 生成统计信息
            statistics = self._generate_statistics(
                original_count=len(content_array),
                optimized_count=len(optimized_content),
                male_count=len(male_content),
                female_count=len(female_content)
            )
            
            result_data = {
                'tts_podcast': [male_content, female_content],
                'statistics': statistics,
                'format_description': '二维数组格式：[偶数索引内容(男声), 奇数索引内容(女声)]'
            }
            
            if self.verbose:
                print(f"播客TTS拆分完成：男声{len(male_content)}段，女声{len(female_content)}段")
            
            return self._create_success_response(result_data, "播客TTS拆分处理成功")
            
        except Exception as e:
            error_msg = f"播客TTS处理失败: {str(e)}"
            print(error_msg)
            return self._create_error_response(500, error_msg, {"error": str(e)})
    
    def _validate_podcast_data(self, podcast_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        验证播客数据格式
        
        Args:
            podcast_data: 播客数据
            
        Returns:
            Dict: 验证结果
        """
        errors = []
        
        # 检查基本结构
        if not isinstance(podcast_data, dict):
            errors.append("播客数据必须是字典类型")
            return {"valid": False, "errors": errors}
        
        # 检查title字段
        if 'title' not in podcast_data:
            errors.append("缺少title字段")
        elif not isinstance(podcast_data['title'], str):
            errors.append("title字段必须是字符串类型")
        elif not podcast_data['title'].strip():
            errors.append("title字段不能为空")
        
        # 检查content字段
        if 'content' not in podcast_data:
            errors.append("缺少content字段")
        elif not isinstance(podcast_data['content'], list):
            errors.append("content字段必须是数组类型")
        elif len(podcast_data['content']) == 0:
            errors.append("content数组不能为空")
        elif len(podcast_data['content']) < 2:
            errors.append("content数组至少需要2个元素")
        
        # 检查content数组中的每个元素
        if 'content' in podcast_data and isinstance(podcast_data['content'], list):
            for i, item in enumerate(podcast_data['content']):
                if not isinstance(item, str):
                    errors.append(f"content[{i}]必须是字符串类型")
                elif not item.strip():
                    errors.append(f"content[{i}]不能为空")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def _optimize_content_array(self, content_array: List[str]) -> List[str]:
        """
        优化内容数组
        
        Args:
            content_array: 原始内容数组
            
        Returns:
            List[str]: 优化后的内容数组
        """
        optimized_content = []
        
        for i, item in enumerate(content_array):
            if not isinstance(item, str):
                continue
            
            # 文本优化
            optimized_item = self._optimize_text_item(item)
            
            # 跳过空内容
            if self.text_optimization['remove_empty'] and not optimized_item:
                if self.verbose:
                    print(f"跳过空内容项: index {i}")
                continue
            
            # 长度限制
            max_length = self.text_optimization['max_length_per_item']
            if len(optimized_item) > max_length:
                if self.verbose:
                    print(f"截断过长内容: index {i}, 长度 {len(optimized_item)} -> {max_length}")
                optimized_item = optimized_item[:max_length] + '...'
            
            optimized_content.append(optimized_item)
        
        return optimized_content
    
    def _optimize_text_item(self, text: str) -> str:
        """
        优化单个文本项
        
        Args:
            text: 原始文本
            
        Returns:
            str: 优化后的文本
        """
        # 去除首尾空白
        if self.text_optimization['trim_whitespace']:
            text = text.strip()
        
        # 标点符号规范化
        if self.text_optimization['normalize_punctuation']:
            text = self._normalize_punctuation(text)
        
        # 清理多余的空白字符
        text = re.sub(r'\s+', ' ', text)
        
        return text
    
    def _normalize_punctuation(self, text: str) -> str:
        """
        标点符号规范化
        
        Args:
            text: 原始文本
            
        Returns:
            str: 规范化后的文本
        """
        # 规范化标点符号映射
        punctuation_map = {
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
        
        for old_punct, new_punct in punctuation_map.items():
            text = text.replace(old_punct, new_punct)
        
        # 清理重复的标点符号
        text = re.sub(r'([。！？])\1+', r'\1', text)
        text = re.sub(r'([，；：])\1+', r'\1', text)
        
        return text
    
    def _split_by_index(self, content_array: List[str]) -> Tuple[List[str], List[str]]:
        """
        按索引单双拆分内容
        
        Args:
            content_array: 内容数组
            
        Returns:
            Tuple[List[str], List[str]]: (男声内容, 女声内容)
        """
        male_content = []    # 偶数索引 (0,2,4...) - 男声
        female_content = []  # 奇数索引 (1,3,5...) - 女声
        
        for i, text in enumerate(content_array):
            if i % 2 == 0:
                # 偶数索引 - 男声
                male_content.append(text)
            else:
                # 奇数索引 - 女声
                female_content.append(text)
        
        return male_content, female_content
    
    def _post_process_content_group(self, content_group: List[str], voice_type: str) -> List[str]:
        """
        后处理内容分组
        
        Args:
            content_group: 内容分组
            voice_type: 声音类型（用于日志）
            
        Returns:
            List[str]: 处理后的内容分组
        """
        processed_group = []
        
        for i, text in enumerate(content_group):
            # 确保文本以适当的标点符号结尾
            if text and not text.endswith(('。', '！', '？', '，', '；', '：')):
                text += '。'
            
            processed_group.append(text)
        
        if self.verbose:
            print(f"{voice_type}分组后处理完成: {len(processed_group)}项")
        
        return processed_group
    
    def _generate_statistics(self, original_count: int, optimized_count: int, 
                           male_count: int, female_count: int) -> Dict[str, Any]:
        """
        生成统计信息
        
        Args:
            original_count: 原始项目数
            optimized_count: 优化后项目数
            male_count: 男声项目数
            female_count: 女声项目数
            
        Returns:
            Dict: 统计信息
        """
        return {
            'original_count': original_count,
            'optimized_count': optimized_count,
            'removed_count': original_count - optimized_count,
            'male_count': male_count,
            'female_count': female_count,
            'total_split_count': male_count + female_count,
            'split_ratio': {
                'male_percentage': round((male_count / (male_count + female_count)) * 100, 1) if (male_count + female_count) > 0 else 0,
                'female_percentage': round((female_count / (male_count + female_count)) * 100, 1) if (male_count + female_count) > 0 else 0
            },
            'processing_summary': f"原始{original_count}项 -> 优化{optimized_count}项 -> 男声{male_count}项/女声{female_count}项"
        }
    
    def _create_success_response(self, data: Any, message: str = "操作成功") -> Dict[str, Any]:
        """创建成功响应"""
        return {
            'success': True,
            'code': 200,
            'message': message,
            'data': data
        }
    
    def _create_error_response(self, code: int, message: str, details: Any = None) -> Dict[str, Any]:
        """创建错误响应"""
        return {
            'success': False,
            'code': code,
            'message': message,
            'error': {
                'code': code,
                'message': message,
                'details': details
            }
        }
    
    def get_processor_info(self) -> Dict[str, Any]:
        """
        获取处理器信息
        
        Returns:
            Dict: 处理器信息
        """
        return {
            'processor_name': 'PodcastTTSProcessor',
            'version': '1.0.0',
            'description': '播客内容TTS拆分处理器',
            'split_strategy': {
                'male_voice': '偶数索引 (0, 2, 4, 6, ...)',
                'female_voice': '奇数索引 (1, 3, 5, 7, ...)'
            },
            'configuration': {
                'min_group_size': self.min_group_size,
                'max_group_size': self.max_group_size,
                'text_optimization': self.text_optimization
            }
        }