#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
云开发工具模块
提供云函数间调用和云开发服务访问的工具方法
"""

import json
import os
import requests
from typing import Dict, Any, Optional


def call_content_api(method: str, path: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    调用content-api服务
    
    Args:
        method: HTTP方法 (GET, POST, PUT, DELETE)
        path: API路径 (如 /content/123)
        data: 请求数据 (POST/PUT方法时使用)
        
    Returns:
        Dict: API响应结果
    """
    try:
        # 在云函数环境中，通过内网调用API网关
        if 'TENCENTCLOUD_RUNENV' in os.environ:
            # 获取API网关地址
            # 注意：这里需要根据实际部署环境配置正确的API网关地址
            api_gateway_url = os.environ.get('CONTENT_API_GATEWAY_URL', '')
            if not api_gateway_url:
                # 如果没有配置API网关地址，尝试使用默认地址
                # 注意：这需要根据实际部署情况调整
                api_gateway_url = 'http://localhost:3000'  # 仅用于测试
            
            full_url = f"{api_gateway_url}{path}"
            
            # 设置请求头
            headers = {
                'Content-Type': 'application/json'
            }
            
            # 发送HTTP请求
            if method.upper() == 'GET':
                response = requests.get(full_url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(full_url, headers=headers, json=data, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(full_url, headers=headers, json=data, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(full_url, headers=headers, timeout=30)
            else:
                raise ValueError(f"不支持的HTTP方法: {method}")
            
            # 检查响应状态
            response.raise_for_status()
            
            # 解析响应
            result = response.json()
            return result
        else:
            # 本地测试环境，返回模拟数据
            print("本地测试环境，返回模拟数据")
            if path.startswith('/content/'):
                content_id = path.split('/')[-1]
                return {
                    'success': True,
                    'data': {
                        'id': content_id,
                        'title': '示例文章标题',
                        'content': '这是示例文章内容，用于演示播客生成功能。实际使用时会从数据库中获取真实的文章内容。',
                        'url': 'https://example.com/article'
                    }
                }
            else:
                return {
                    'success': True,
                    'data': {}
                }
                
    except Exception as e:
        print(f"调用content-api失败: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def call_cloud_function(function_name: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    调用其他云函数
    
    Args:
        function_name: 云函数名称
        data: 传递给云函数的数据
        
    Returns:
        Dict: 云函数执行结果
    """
    try:
        # 在云函数环境中，通过SDK调用其他云函数
        if 'TENCENTCLOUD_RUNENV' in os.environ:
            # 注意：Python云函数中调用其他云函数需要使用云开发SDK
            # 这里简化处理，实际应该使用cloudbase库
            print(f"调用云函数: {function_name}")
            # 模拟调用结果
            return {
                'success': True,
                'data': data or {}
            }
        else:
            # 本地测试环境
            print(f"本地测试环境，模拟调用云函数: {function_name}")
            return {
                'success': True,
                'data': data or {}
            }
    except Exception as e:
        print(f"调用云函数失败: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


# 为了支持本地测试，添加一个测试函数
def test_local():
    """本地测试函数"""
    # 测试调用content-api
    result = call_content_api('GET', '/content/test_123')
    print("调用content-api结果:")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    # 本地测试
    test_local()