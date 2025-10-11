#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PodcastGeneratorService 云函数入口文件
播客稿生成和TTS拆分服务
"""

import json
import traceback
from PodcastGeneratorService import PodcastGeneratorService


def main(event, context):
    """
    云函数主入口方法
    
    Args:
        event: 事件对象，包含请求数据
        context: 上下文对象
        
    Returns:
        dict: 包含处理结果的响应
    """
    try:
        print("PodcastGeneratorService 开始处理请求")
        print(f"Event: {json.dumps(event, ensure_ascii=False)}")
        
        # 解析事件数据
        if 'body' in event:
            # HTTP请求模式
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        else:
            # 直接调用模式
            body = event
        
        # 获取请求参数
        content_id = body.get('content_id', '')
        style = body.get('style', None)
        
        # 参数验证
        if not content_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'code': 400,
                    'message': '缺少content_id参数',
                    'error': {
                        'code': 400,
                        'message': '缺少content_id参数',
                        'details': '请提供content_id参数'
                    }
                }, ensure_ascii=False)
            }
        
        # 创建服务实例并处理请求
        service = PodcastGeneratorService()
        result = service.generate_podcast(content_id, style)
        
        # 确定HTTP状态码
        status_code = 200 if result['success'] else result.get('code', 500)
        
        # 安全地获取message字段，避免KeyError
        message = result.get('message', '处理完成')
        print(f"PodcastGeneratorService 处理完成: {message}")
        
        # 返回结果
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
            },
            'body': json.dumps(result, ensure_ascii=False)
        }
        
    except json.JSONDecodeError as e:
        # JSON解析错误
        error_result = {
            'success': False,
            'code': 400,
            'message': 'JSON格式错误',
            'error': {
                'code': 400,
                'message': 'JSON格式错误',
                'details': str(e)
            }
        }
        
        print(f"JSON解析错误: {str(e)}")
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json; charset=utf-8'
            },
            'body': json.dumps(error_result, ensure_ascii=False)
        }
        
    except Exception as e:
        # 其他未预期的错误
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc()
        }
        
        error_result = {
            'success': False,
            'code': 500,
            'message': '服务内部错误',
            'error': {
                'code': 500,
                'message': '服务内部错误',
                'details': error_details
            }
        }
        
        print(f"PodcastGeneratorService 发生未预期错误:")
        print(f"错误类型: {type(e).__name__}")
        print(f"错误信息: {str(e)}")
        print(f"错误堆栈: {traceback.format_exc()}")
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json; charset=utf-8'
            },
            'body': json.dumps(error_result, ensure_ascii=False)
        }