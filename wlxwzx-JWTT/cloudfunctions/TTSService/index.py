#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TTSService 云函数入口文件
语音合成和音频文件管理服务
"""

import json
import traceback
from datetime import datetime
from TTSService import TTSService


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
        print("TTSService 开始处理请求")
        
        # 解析事件数据
        if 'body' in event:
            if isinstance(event['body'], str):
                body = json.loads(event['body'])
            else:
                body = event['body']
        else:
            body = event
        
        # 如果是API测试请求
        if body.get('api_test'):
            from test_api import test_qwen_tts_api
            success = test_qwen_tts_api()
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'success': success,
                    'message': 'API测试完成，请查看日志获取详细信息',
                    'timestamp': datetime.now().isoformat()
                }, ensure_ascii=False)
            }
        
        # 获取请求参数
        content_id = body.get('content_id', '')
        audio_type = body.get('audio_type', '')
        
        # 参数验证
        if not content_id:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'code': 400,
                    'message': '缺少content_id参数'
                }, ensure_ascii=False)
            }
        
        if not audio_type or audio_type not in ['original', 'podcast']:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'code': 400,
                    'message': 'audio_type必须是original或podcast'
                }, ensure_ascii=False)
            }
        
        # 创建服务实例并处理请求
        service = TTSService()
        result = service.synthesize_audio(content_id, audio_type)
        
        print(f"TTSService 处理完成: {result['message']}")
        
        return {
            'statusCode': 200 if result['success'] else result.get('code', 500),
            'headers': {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, ensure_ascii=False)
        }
        
    except Exception as e:
        error_result = {
            'success': False,
            'code': 500,
            'message': '服务内部错误',
            'error': str(e)
        }
        
        return {
            'statusCode': 500,
            'body': json.dumps(error_result, ensure_ascii=False)
        }


if __name__ == '__main__':
    # 本地测试
    test_event = {
        'content_id': 'test_123',
        'audio_type': 'original'
    }
    result = main(test_event, {})
    print(json.dumps(result, ensure_ascii=False, indent=2))