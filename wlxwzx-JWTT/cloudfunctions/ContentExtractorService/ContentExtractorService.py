#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ContentExtractorService - 内容提取服务
负责网页内容提取、清洗和TTS文本分段处理
"""

import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse

from WebContentExtractor import WebContentExtractor
from TTSTextProcessor import TTSTextProcessor
from config import (
    EXTRACTION_CONFIG, 
    TTS_CONFIG, 
    DATABASE_CONFIG, 
    LOGGING_CONFIG, 
    ERROR_CONFIG
)


class ContentExtractorService:
    """内容提取服务主类"""
    
    def __init__(self):
        self.extractor = WebContentExtractor()
        self.tts_processor = TTSTextProcessor()
        self.verbose = LOGGING_CONFIG['VERBOSE']
    
    def extract_content(self, url: str, options: Optional[Dict] = None) -> Dict[str, Any]:
        """
        提取网页内容并进行TTS文本分段
        
        Args:
            url: 网页链接
            options: 提取选项配置
            
        Returns:
            Dict: 提取结果对象（包含tts_content分段结果）
        """
        try:
            start_time = time.time()
            print(f"开始提取网页内容: {url}")
            
            # 1. 参数验证
            if not self._validate_url(url):
                return self._create_error_response(
                    400, 
                    "URL格式不正确", 
                    {"url": url}
                )
            
            # 2. 检查缓存（可选）
            # TODO: 实现缓存检查逻辑
            
            # 3. 网页内容抓取
            extraction_result = self._extract_web_content(url, options)
            if not extraction_result['success']:
                return extraction_result
            
            content_data = extraction_result['data']
            
            # 4. 进行TTS文本分段处理
            tts_result = self._process_tts_content(content_data['content'])
            if not tts_result['success']:
                print(f"TTS处理失败，但继续保存原始内容: {tts_result['error']}")
                # TTS处理失败不影响主流程，设置空的分段结果
                tts_content = []
                tts_statistics = {}
            else:
                tts_content = tts_result['data']['segments']
                tts_statistics = tts_result['data']['statistics']
            
            # 5. 构建完整结果
            final_result = {
                'id': None,  # 将在数据库保存后设置
                'url': url,
                'title': content_data['title'],
                'content': content_data['content'],
                'content_length': content_data['content_length'],
                'tts_content': tts_content,
                'tts_statistics': tts_statistics,
                'extraction_time': round(time.time() - start_time, 2),
                'timestamp': datetime.now().isoformat(),
                'status': 'extracted'
            }
            
            # 6. 数据存储（通过API网关的DatabaseService）
            # 注意：在新架构中，数据库操作将通过content-api进行
            # 这里返回结果，由调用方处理数据存储
            
            print(f"内容提取完成: {final_result['title'][:50]}... "
                  f"({final_result['content_length']}字符, "
                  f"{len(tts_content)}段TTS, "
                  f"{final_result['extraction_time']}秒)")
            
            return self._create_success_response(final_result, "内容提取成功")
            
        except Exception as e:
            print(f"内容提取失败: {str(e)}")
            return self._create_error_response(
                500, 
                "内容提取失败", 
                {"error": str(e), "url": url}
            )
    
    def _validate_url(self, url: str) -> bool:
        """
        验证URL格式
        
        Args:
            url: 待验证的URL
            
        Returns:
            bool: 是否有效
        """
        try:
            if not url or not isinstance(url, str):
                return False
            
            # 基础格式检查
            parsed_url = urlparse(url.strip())
            if not parsed_url.scheme or not parsed_url.netloc:
                return False
            
            # 支持的协议
            if parsed_url.scheme.lower() not in ['http', 'https']:
                return False
            
            return True
            
        except Exception as e:
            print(f"URL验证失败: {str(e)}")
            return False
    
    def _extract_web_content(self, url: str, options: Optional[Dict] = None) -> Dict[str, Any]:
        """
        网页内容抓取核心逻辑
        
        Args:
            url: 网页URL
            options: 提取选项
            
        Returns:
            Dict: 提取结果
        """
        try:
            # 合并配置选项
            extract_options = {
                'timeout': EXTRACTION_CONFIG['REQUEST_TIMEOUT'],
                'max_retries': EXTRACTION_CONFIG['MAX_RETRIES'],
                'retry_delay': EXTRACTION_CONFIG['RETRY_DELAY'],
                'max_content_length': EXTRACTION_CONFIG['MAX_CONTENT_LENGTH']
            }
            
            if options:
                extract_options.update(options)
            
            # 调用WebContentExtractor进行提取
            result = self.extractor.extract_content(url)
            
            # 验证提取结果
            if not result or not result.get('title') or not result.get('content'):
                return self._create_error_response(
                    422, 
                    "无法提取有效内容", 
                    {"url": url, "result": result}
                )
            
            # 内容长度检查
            content_length = len(result['content'])
            if content_length > extract_options['max_content_length']:
                print(f"内容过长({content_length}字符)，将截断到{extract_options['max_content_length']}字符")
                result['content'] = result['content'][:extract_options['max_content_length']] + '...'
                result['content_length'] = len(result['content'])
                result['truncated'] = True
            else:
                result['truncated'] = False
            
            # 内容质量检查
            if content_length < 50:
                return self._create_error_response(
                    422, 
                    "提取的内容过短，可能不是有效文章", 
                    {"url": url, "content_length": content_length}
                )
            
            return self._create_success_response(result, "网页内容提取成功")
            
        except ValueError as e:
            # URL格式错误
            return self._create_error_response(400, f"URL格式错误: {str(e)}", {"url": url})
        except Exception as e:
            # 其他提取错误
            return self._create_error_response(500, f"内容提取失败: {str(e)}", {"url": url})
    
    def _process_tts_content(self, content: str) -> Dict[str, Any]:
        """
        TTS文本分段处理
        
        Args:
            content: 原文内容
            
        Returns:
            Dict: TTS处理结果
        """
        try:
            print("开始TTS文本分段处理...")
            
            # 调用TTS处理器进行分段
            segments = self.tts_processor.process_content(content)
            
            if not segments:
                return self._create_error_response(
                    422, 
                    "TTS文本分段失败，未能生成有效分段", 
                    {"content_length": len(content)}
                )
            
            # 获取分段统计信息
            statistics = self.tts_processor.get_segment_statistics(segments)
            
            print(f"TTS分段完成: {statistics['total_segments']}段, "
                  f"平均{statistics['average_length']:.1f}字符/段")
            
            result_data = {
                'segments': segments,
                'statistics': statistics,
                'processing_time': time.time()  # 可以添加计时
            }
            
            return self._create_success_response(result_data, "TTS分段处理成功")
            
        except Exception as e:
            print(f"TTS文本处理失败: {str(e)}")
            return self._create_error_response(
                500, 
                f"TTS文本处理失败: {str(e)}", 
                {"content_length": len(content)}
            )
    
    def _create_success_response(self, data: Any, message: str = "操作成功") -> Dict[str, Any]:
        """
        创建成功响应
        
        Args:
            data: 响应数据
            message: 响应消息
            
        Returns:
            Dict: 标准成功响应
        """
        return {
            'success': True,
            'code': 200,
            'message': message,
            'data': data,
            'timestamp': datetime.now().isoformat()
        }
    
    def _create_error_response(self, code: int, message: str, details: Any = None) -> Dict[str, Any]:
        """
        创建错误响应
        
        Args:
            code: 错误码
            message: 错误消息
            details: 错误详情
            
        Returns:
            Dict: 标准错误响应
        """
        return {
            'success': False,
            'code': code,
            'message': message,
            'error': {
                'code': code,
                'message': message,
                'details': details
            },
            'timestamp': datetime.now().isoformat()
        }
    
    def get_service_info(self) -> Dict[str, Any]:
        """
        获取服务信息
        
        Returns:
            Dict: 服务信息
        """
        return {
            'service_name': 'ContentExtractorService',
            'version': '1.0.0',
            'description': '网页内容提取和TTS文本分段服务',
            'features': [
                '网页内容提取',
                '内容清洗和规范化',
                'TTS文本分段处理',
                '内容质量验证',
                '统计信息生成'
            ],
            'configuration': {
                'max_content_length': EXTRACTION_CONFIG['MAX_CONTENT_LENGTH'],
                'max_segment_length': TTS_CONFIG['MAX_SEGMENT_LENGTH'],
                'min_segment_length': TTS_CONFIG['MIN_SEGMENT_LENGTH'],
                'request_timeout': EXTRACTION_CONFIG['REQUEST_TIMEOUT']
            }
        }