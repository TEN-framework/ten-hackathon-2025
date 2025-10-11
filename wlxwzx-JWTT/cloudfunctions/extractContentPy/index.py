#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
网页内容提取云函数 - 标准入口文件
v0.1.1功能：提取网页标题和正文内容
"""

import json
from WebContentExtractor import WebContentExtractor


def main(event, context):
    """
    云函数主入口方法
    
    Args:
        event: 事件对象，包含请求数据
        context: 上下文对象
        
    Returns:
        dict: 包含提取结果的响应
    """
    try:
        # 解析事件数据
        if 'body' in event:
            # 如果是HTTP请求，body是字符串
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
            
        # 获取URL参数
        url = body.get('url', '')
        
        if not url:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'code': 400,
                    'message': '缺少URL参数',
                    'data': None
                })
            }
        
        # 创建提取器实例
        extractor = WebContentExtractor()
        
        # 提取网页内容
        result = extractor.extract_content(url)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'code': 200,
                'message': '提取成功',
                'data': result
            })
        }
        
    except ValueError as e:
        # URL验证失败
        return {
            'statusCode': 400,
            'body': json.dumps({
                'code': 400,
                'message': f'参数错误: {str(e)}',
                'data': None
            })
        }
    except Exception as e:
        # 其他异常
        return {
            'statusCode': 500,
            'body': json.dumps({
                'code': 500,
                'message': f'提取失败: {str(e)}',
                'data': None
            })
        }