#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PodcastGeneratorService - 播客生成服务
负责调用AI模型生成播客稿并进行TTS拆分处理
"""

import json
import time
import os
import requests
from datetime import datetime
from typing import Dict, Any, Optional

from QwenAPIClient import QwenAPIClient
from PodcastTTSProcessor import PodcastTTSProcessor
from config import (
    QWEN_API_CONFIG,
    PODCAST_CONFIG, 
    TTS_SPLIT_CONFIG,
    DATABASE_CONFIG,
    ERROR_CONFIG,
    LOGGING_CONFIG
)
# 导入API配置
from api_config import CLOUDBASE_API_KEY, API_GATEWAY_URL_TEMPLATE
# 导入云开发工具模块
from tcb_cloud import call_content_api


class PodcastGeneratorService:
    """播客生成服务主类"""
    
    def __init__(self):
        self.qwen_client = QwenAPIClient()
        self.tts_processor = PodcastTTSProcessor()
        self.verbose = LOGGING_CONFIG['VERBOSE']
    
    def generate_podcast(self, content_id: str, style: str = None) -> Dict[str, Any]:
        """
        生成播客稿并进行TTS拆分处理
        
        Args:
            content_id: 内容记录ID
            style: 播客风格，默认使用配置中的默认风格
            
        Returns:
            Dict: 播客生成结果（包含tts_podcast拆分结果）
        """
        try:
            start_time = time.time()
            
            if self.verbose:
                print(f"开始生成播客稿，内容ID: {content_id}")
            
            # 1. 参数验证
            if not content_id or not isinstance(content_id, str):
                return self._create_error_response(
                    400,
                    "content_id参数不能为空且必须是字符串",
                    {"content_id": content_id}
                )
            
            # 2. 设置播客风格
            podcast_style = style or PODCAST_CONFIG['DEFAULT_STYLE']
            if podcast_style not in PODCAST_CONFIG['SUPPORTED_STYLES']:
                print(f"警告：不支持的播客风格 '{podcast_style}'，使用默认风格")
                podcast_style = PODCAST_CONFIG['DEFAULT_STYLE']
            
            # 3. 获取原文内容（这里需要调用数据库服务获取）
            # 注意：在新架构中，数据库操作通过content-api进行
            # 这里直接返回一个模拟结果，实际应该调用API
            content_data = self._get_content_data(content_id)
            if not content_data['success']:
                return content_data
            
            title = content_data['data']['title']
            content = content_data['data']['content']
            
            # 4. 构建AI提示词
            prompt_messages = self._build_prompt_messages(title, content, podcast_style)
            
            # 5. 调用AI模型生成播客稿
            ai_result = self._generate_podcast_with_ai(prompt_messages)
            if not ai_result['success']:
                return ai_result
            
            podcast_data = ai_result['data']
            
            # 6. 播客稿后处理（拆分为TTS格式）
            tts_result = self._process_podcast_for_tts(podcast_data)
            if not tts_result['success']:
                return tts_result
            
            tts_podcast = tts_result['data']['tts_podcast']
            tts_statistics = tts_result['data']['statistics']
            
            # 7. 构建完整结果
            final_result = {
                'content_id': content_id,
                'podcast': podcast_data,
                'tts_podcast': tts_podcast,
                'tts_statistics': tts_statistics,
                'style': podcast_style,
                'generation_time': round(time.time() - start_time, 2),
                'timestamp': datetime.now().isoformat()
            }
            
            # 8. 保存播客数据到数据库（通过API网关）
            # 这里返回结果，由调用方处理数据存储
            
            if self.verbose:
                print(f"播客生成完成: {podcast_data['title']} "
                      f"({len(podcast_data['content'])}对话, "
                      f"男声{len(tts_podcast[0])}段/女声{len(tts_podcast[1])}段, "
                      f"{final_result['generation_time']}秒)")
            
            return self._create_success_response(final_result, "播客生成成功")
            
        except Exception as e:
            error_msg = f"播客生成失败: {str(e)}"
            print(error_msg)
            return self._create_error_response(500, error_msg, {"content_id": content_id, "error": str(e)})
    
    def _get_content_data(self, content_id: str) -> Dict[str, Any]:
        """
        获取原文内容数据
        
        注意：在新架构中，这应该通过调用content-api来获取数据
        这里提供一个模拟实现
        
        Args:
            content_id: 内容ID
            
        Returns:
            Dict: 内容数据
        """
        try:
            # 在云函数环境中，通过HTTP API调用content-api
            if 'TENCENTCLOUD_RUNENV' in os.environ:
                try:
                    # 获取环境ID
                    env_id = os.environ.get('TENCENTCLOUD_ENV_ID', 'cloud1-8grkg0ar5f169249')
                    
                    # 构造API网关URL
                    # 根据云开发文档，云函数HTTP API调用格式为 {env-id}.api.tcloudbasegateway.com/v1/functions/{function-name}
                    api_gateway_url = API_GATEWAY_URL_TEMPLATE.format(env_id=env_id)
                    # 修复：正确构造API路径，需要包含函数名
                    function_url = f"{api_gateway_url}/v1/functions/content-api"
                    
                    # 设置请求头，包含API Key认证
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {CLOUDBASE_API_KEY}'
                    }
                    
                    # 构造请求数据，调用content-api的/content/{id}路径
                    payload = {
                        "path": f"/content/{content_id}",
                        "httpMethod": "GET"
                    }
                    
                    # 发送HTTP POST请求调用云函数
                    response = requests.post(function_url, headers=headers, json=payload, timeout=30)
                    
                    # 检查响应状态
                    response.raise_for_status()
                    
                    # 解析响应
                    api_result = response.json()
                    
                    # 从HTTP API响应中提取body内容
                    # 修正：HTTP API响应格式与云函数直接调用格式不同
                    if 'body' in api_result:
                        try:
                            body_data = json.loads(api_result['body'])
                            if body_data.get('success') and body_data.get('data'):
                                # 成功获取到内容数据
                                content_data = body_data['data']
                                # 修复：增加字段存在性检查，避免KeyError
                                return {
                                    'success': True,
                                    'data': {
                                        'id': content_data.get('id', ''),
                                        'title': content_data.get('title', '未知标题'),
                                        'content': content_data.get('content', ''),
                                        'url': content_data.get('url', '')
                                    }
                                }
                            else:
                                # API调用失败或未找到内容，返回错误信息
                                error_msg = body_data.get('message', '未找到指定的内容')
                                print(f"获取内容数据失败: {error_msg}")
                                return {
                                    'success': False,
                                    'message': error_msg,
                                    'error': error_msg
                                }
                        except json.JSONDecodeError as e:
                            print(f"解析响应body失败: {str(e)}")
                            print(f"响应body内容: {api_result['body']}")
                            return {
                                'success': False,
                                'message': f"解析响应body失败: {str(e)}",
                                'error': str(e)
                            }
                    else:
                        print(f"HTTP API调用响应格式不正确: {api_result}")
                        print(f"期望的格式应包含 'body' 字段")
                        return {
                            'success': False,
                            'message': 'HTTP API调用响应格式不正确',
                            'error': api_result
                        }
                        
                except requests.RequestException as http_error:
                    print(f"HTTP请求失败: {str(http_error)}")
                    return {
                        'success': False,
                        'message': f"HTTP请求失败: {str(http_error)}",
                        'error': str(http_error)
                    }
                except Exception as api_error:
                    print(f"调用content-api失败: {str(api_error)}")
                    return {
                        'success': False,
                        'message': f"调用content-api失败: {str(api_error)}",
                        'error': str(api_error)
                    }
            
            # 如果不在云函数环境中（本地测试），返回错误信息
            return {
                'success': False,
                'message': '服务只能在云函数环境中运行',
                'error': 'Not running in cloud function environment'
            }
        except Exception as e:
            print(f"获取内容数据异常: {str(e)}")
            return {
                'success': False,
                'message': f"获取内容数据异常: {str(e)}",
                'error': str(e)
            }

    def _build_prompt_messages(self, title: str, content: str, style: str) -> list:
        """
        构建AI提示词消息
        
        Args:
            title: 文章标题
            content: 文章内容
            style: 播客风格
            
        Returns:
            list: 消息列表
        """
        # 内容长度检查和截断
        max_content_length = QWEN_API_CONFIG['MAX_CONTENT_LENGTH']
        if len(content) > max_content_length:
            if self.verbose:
                print(f"内容过长({len(content)}字符)，截断到{max_content_length}字符")
            content = content[:max_content_length] + '...'
        
        # 构建系统提示词
        system_prompt = PODCAST_CONFIG['SYSTEM_PROMPT_TEMPLATE'].format(
            title=title,
            content=content
        )
        
        messages = [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": f"请用{style}编写"
            }
        ]
        
        return messages
    
    def _generate_podcast_with_ai(self, messages: list) -> Dict[str, Any]:
        """
        使用AI模型生成播客稿
        
        Args:
            messages: 提示词消息列表
            
        Returns:
            Dict: AI生成结果
        """
        try:
            if self.verbose:
                print("开始调用AI模型生成播客稿...")
            
            # 调用通义千问API
            api_result = self.qwen_client.generate_chat_completion(messages)
            if not api_result['success']:
                return self._create_error_response(
                    502,
                    "AI模型调用失败",
                    api_result['error']
                )
            
            # 提取响应内容
            try:
                response_content = self.qwen_client.extract_text_content(api_result['data'])
            except Exception as e:
                return self._create_error_response(
                    422,
                    "AI响应内容提取失败",
                    {"error": str(e)}
                )
            
            # 解析播客稿内容
            podcast_data = self._parse_podcast_content(response_content)
            if not podcast_data['success']:
                return podcast_data
            
            if self.verbose:
                print("AI播客稿生成成功")
            
            return self._create_success_response(
                podcast_data['data'],
                "AI播客稿生成成功"
            )
            
        except Exception as e:
            return self._create_error_response(
                500,
                f"AI播客稿生成过程失败: {str(e)}",
                {"error": str(e)}
            )
    
    def _parse_podcast_content(self, content: str) -> Dict[str, Any]:
        """
        解析AI响应的播客稿内容
        
        Args:
            content: AI响应的文本内容
            
        Returns:
            Dict: 解析结果
        """
        try:
            if self.verbose:
                print("开始解析AI生成的播客稿...")
            
            # 尝试直接解析JSON
            try:
                parsed_data = json.loads(content)
            except json.JSONDecodeError:
                # 如果直接解析失败，尝试从文本中提取JSON
                import re
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    try:
                        parsed_data = json.loads(json_match.group())
                    except json.JSONDecodeError as e:
                        return self._create_error_response(
                            422,
                            "无法解析AI响应中的JSON内容",
                            {"content": content[:500], "error": str(e)}
                        )
                else:
                    return self._create_error_response(
                        422,
                        "AI响应中未找到有效的JSON格式",
                        {"content": content[:500]}
                    )
            
            # 验证播客稿结构
            validation_result = self._validate_podcast_structure(parsed_data)
            if not validation_result['valid']:
                return self._create_error_response(
                    422,
                    "播客稿格式验证失败",
                    validation_result['errors']
                )
            
            if self.verbose:
                print(f"播客稿解析成功: {len(parsed_data['content'])}条对话")
            
            return self._create_success_response(parsed_data, "播客稿解析成功")
            
        except Exception as e:
            return self._create_error_response(
                500,
                f"播客稿解析过程失败: {str(e)}",
                {"content": content[:200], "error": str(e)}
            )
    
    def _validate_podcast_structure(self, podcast_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        验证播客稿结构
        
        Args:
            podcast_data: 解析后的播客数据
            
        Returns:
            Dict: 验证结果
        """
        errors = []
        
        # 检查基本结构
        if not isinstance(podcast_data, dict):
            errors.append("播客数据必须是字典格式")
            return {"valid": False, "errors": errors}
        
        # 检查必需字段
        required_fields = ['title', 'content']
        for field in required_fields:
            if field not in podcast_data:
                errors.append(f"缺少必需字段: {field}")
        
        # 检查title字段
        if 'title' in podcast_data:
            if not isinstance(podcast_data['title'], str):
                errors.append("title字段必须是字符串")
            elif not podcast_data['title'].strip():
                errors.append("title字段不能为空")
        
        # 检查content字段
        if 'content' in podcast_data:
            content = podcast_data['content']
            if not isinstance(content, list):
                errors.append("content字段必须是数组")
            elif len(content) < PODCAST_CONFIG['MIN_CONTENT_ITEMS']:
                errors.append(f"content数组至少需要{PODCAST_CONFIG['MIN_CONTENT_ITEMS']}个元素")
            elif len(content) > PODCAST_CONFIG['MAX_CONTENT_ITEMS']:
                errors.append(f"content数组最多允许{PODCAST_CONFIG['MAX_CONTENT_ITEMS']}个元素")
            else:
                # 检查每个content元素
                for i, item in enumerate(content):
                    if not isinstance(item, str):
                        errors.append(f"content[{i}]必须是字符串")
                    elif not item.strip():
                        errors.append(f"content[{i}]不能为空")
                    elif len(item) > PODCAST_CONFIG['MAX_ITEM_LENGTH']:
                        errors.append(f"content[{i}]长度超过限制({PODCAST_CONFIG['MAX_ITEM_LENGTH']}字符)")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def _process_podcast_for_tts(self, podcast_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        播客稿TTS处理
        
        Args:
            podcast_data: 播客数据
            
        Returns:
            Dict: TTS处理结果
        """
        try:
            if self.verbose:
                print("开始播客TTS拆分处理...")
            
            # 调用TTS处理器
            result = self.tts_processor.process_podcast_for_tts(podcast_data)
            
            if self.verbose:
                if result['success']:
                    print("播客TTS拆分处理成功")
                else:
                    print(f"播客TTS拆分处理失败: {result['message']}")
            
            return result
            
        except Exception as e:
            return self._create_error_response(
                500,
                f"播客TTS处理失败: {str(e)}",
                {"error": str(e)}
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
            'service_name': 'PodcastGeneratorService',
            'version': '1.0.0',
            'description': '播客稿生成和TTS拆分服务',
            'features': [
                'AI播客稿生成',
                '播客内容解析和验证',
                'TTS拆分处理（单双索引分组）',
                '多种播客风格支持'
            ],
            'configuration': {
                'supported_styles': PODCAST_CONFIG['SUPPORTED_STYLES'],
                'default_style': PODCAST_CONFIG['DEFAULT_STYLE'],
                'ai_model': QWEN_API_CONFIG['MODEL_NAME'],
                'max_content_length': QWEN_API_CONFIG['MAX_CONTENT_LENGTH']
            },
            'components': {
                'qwen_client': self.qwen_client.get_client_info(),
                'tts_processor': self.tts_processor.get_processor_info()
            }
        }