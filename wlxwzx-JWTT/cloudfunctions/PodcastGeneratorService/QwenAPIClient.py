#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通义千问API客户端
负责与通义千问API进行通信
"""

import json
import time
import requests
from typing import Dict, Any, List, Optional
from config import QWEN_API_CONFIG, LOGGING_CONFIG


class QwenAPIClient:
    """通义千问API客户端类"""
    
    def __init__(self):
        self.base_url = QWEN_API_CONFIG['BASE_URL']
        self.api_key = QWEN_API_CONFIG['API_KEY']
        self.timeout = QWEN_API_CONFIG['TIMEOUT']
        self.max_retries = QWEN_API_CONFIG['MAX_RETRIES']
        self.retry_delay = QWEN_API_CONFIG['RETRY_DELAY']
        self.model_name = QWEN_API_CONFIG['MODEL_NAME']
        self.max_tokens = QWEN_API_CONFIG['MAX_TOKENS']
        self.temperature = QWEN_API_CONFIG['TEMPERATURE']
        self.verbose = LOGGING_CONFIG['VERBOSE']
        
        # 设置请求头
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
    
    def generate_chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        生成聊天完成响应
        
        Args:
            messages: 消息列表，格式为[{"role": "user", "content": "..."}]
            **kwargs: 额外参数
            
        Returns:
            Dict: API响应结果
        """
        try:
            if self.verbose:
                print(f"开始调用通义千问API，消息数量: {len(messages)}")
            
            # 构建请求数据
            request_data = {
                'model': kwargs.get('model', self.model_name),
                'messages': messages,
                'temperature': kwargs.get('temperature', self.temperature),
                'max_tokens': kwargs.get('max_tokens', self.max_tokens),
                'stream': False  # 非流式输出
            }
            
            # 发送请求
            response = self._send_request_with_retry(
                url=f"{self.base_url}/chat/completions",
                data=request_data
            )
            
            if self.verbose:
                print("通义千问API调用成功")
            
            return {
                'success': True,
                'data': response,
                'message': 'API调用成功'
            }
            
        except Exception as e:
            error_msg = f"通义千问API调用失败: {str(e)}"
            print(error_msg)
            return {
                'success': False,
                'error': error_msg,
                'message': 'API调用失败'
            }
    
    def _send_request_with_retry(self, url: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        带重试机制的请求发送
        
        Args:
            url: 请求URL
            data: 请求数据
            
        Returns:
            Dict: 响应数据
        """
        last_error = None
        
        for attempt in range(self.max_retries + 1):
            try:
                if attempt > 0:
                    if self.verbose:
                        print(f"第{attempt}次重试API请求...")
                    time.sleep(self.retry_delay * attempt)
                
                # 发送HTTP请求
                response = requests.post(
                    url=url,
                    headers=self.headers,
                    json=data,
                    timeout=self.timeout
                )
                
                # 检查HTTP状态码
                response.raise_for_status()
                
                # 解析响应数据
                response_data = response.json()
                
                # 检查API响应是否包含错误
                if 'error' in response_data:
                    raise Exception(f"API返回错误: {response_data['error'].get('message', '未知错误')}")
                
                # 验证响应格式
                if 'choices' not in response_data or not response_data['choices']:
                    raise Exception("API返回格式不正确，缺少choices字段")
                
                return response_data
                
            except requests.exceptions.Timeout as e:
                last_error = f"请求超时: {str(e)}"
                if self.verbose:
                    print(last_error)
                    
            except requests.exceptions.HTTPError as e:
                last_error = f"HTTP错误: {e.response.status_code} - {e.response.text}"
                if self.verbose:
                    print(last_error)
                    
            except requests.exceptions.RequestException as e:
                last_error = f"网络请求失败: {str(e)}"
                if self.verbose:
                    print(last_error)
                    
            except json.JSONDecodeError as e:
                last_error = f"JSON解析失败: {str(e)}"
                if self.verbose:
                    print(last_error)
                    
            except Exception as e:
                last_error = f"未知错误: {str(e)}"
                if self.verbose:
                    print(last_error)
        
        # 所有重试都失败了
        raise Exception(f"API请求失败，已重试{self.max_retries}次: {last_error}")
    
    def extract_text_content(self, api_response: Dict[str, Any]) -> str:
        """
        从API响应中提取文本内容
        
        Args:
            api_response: API响应数据
            
        Returns:
            str: 提取的文本内容
        """
        try:
            if not api_response.get('choices'):
                raise Exception("API响应中没有choices字段")
            
            first_choice = api_response['choices'][0]
            if 'message' not in first_choice:
                raise Exception("API响应中没有message字段")
            
            message = first_choice['message']
            if 'content' not in message:
                raise Exception("API响应中没有content字段")
            
            content = message['content']
            if not isinstance(content, str):
                raise Exception("API响应的content字段不是字符串类型")
            
            return content.strip()
            
        except Exception as e:
            raise Exception(f"提取API响应内容失败: {str(e)}")
    
    def test_connection(self) -> Dict[str, Any]:
        """
        测试API连接
        
        Returns:
            Dict: 测试结果
        """
        try:
            if self.verbose:
                print("开始测试通义千问API连接...")
            
            test_messages = [
                {
                    "role": "system",
                    "content": "你是一个测试助手，请回复'连接成功'"
                },
                {
                    "role": "user",
                    "content": "测试连接"
                }
            ]
            
            result = self.generate_chat_completion(
                messages=test_messages,
                max_tokens=10
            )
            
            if result['success']:
                content = self.extract_text_content(result['data'])
                if self.verbose:
                    print(f"API连接测试成功，响应: {content}")
                return {
                    'success': True,
                    'message': 'API连接正常',
                    'response': content
                }
            else:
                return {
                    'success': False,
                    'message': 'API连接失败',
                    'error': result['error']
                }
                
        except Exception as e:
            error_msg = f"API连接测试失败: {str(e)}"
            print(error_msg)
            return {
                'success': False,
                'message': 'API连接测试失败',
                'error': error_msg
            }
    
    def get_client_info(self) -> Dict[str, Any]:
        """
        获取客户端信息
        
        Returns:
            Dict: 客户端信息
        """
        return {
            'client_name': 'QwenAPIClient',
            'version': '1.0.0',
            'base_url': self.base_url,
            'model_name': self.model_name,
            'max_tokens': self.max_tokens,
            'temperature': self.temperature,
            'timeout': self.timeout,
            'max_retries': self.max_retries
        }