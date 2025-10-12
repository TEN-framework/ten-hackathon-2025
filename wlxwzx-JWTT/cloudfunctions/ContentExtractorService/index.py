#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ContentExtractorService 云函数入口文件
网页内容提取和TTS文本分段服务
"""

import json
import traceback
from ContentExtractorService import ContentExtractorService


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
        print(f"ContentExtractorService 开始处理请求")
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
        url = body.get('url', '')
        options = body.get('options', {})
        
        # 参数验证
        if not url:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'code': 400,
                    'message': '缺少URL参数',
                    'error': {
                        'code': 400,
                        'message': '缺少URL参数',
                        'details': '请提供url参数'
                    }
                }, ensure_ascii=False)
            }
        
        # 创建服务实例并处理请求
        service = ContentExtractorService()
        result = service.extract_content(url, options)
        
        # 确定HTTP状态码
        status_code = 200 if result['success'] else result.get('code', 500)
        
        print(f"ContentExtractorService 处理完成: {result['message']}")
        
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
        
        print(f"ContentExtractorService 发生未预期错误:")
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


# 为了支持调试，添加一个测试函数
def test_local():
    """本地测试函数"""
    test_event = {
        'url': 'https://example.com',
        'options': {}
    }
    
    test_context = {}
    
    result = main(test_event, test_context)
    print("测试结果:")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    # 本地测试
    test_local()