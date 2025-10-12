#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
通义千问TTS API客户端
负责调用阿里云通义千问的语音合成API
基于官方MultiModalConversation接口实现
"""

import json
import time
import requests
from typing import Dict, Any, Optional
from datetime import datetime


class QwenTTSClient:
    """通义千问TTS API客户端类"""
    
    def __init__(self, api_key: str,base_url: str,model: str):
        """
        初始化TTS客户端
        
        Args:
            api_key: API密钥
        """
        self.api_key = api_key
        # 使用官方MultiModalConversation接口
        self.base_url = base_url
        self.model = model
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
    def synthesize_speech(
        self, 
        text: str, 
        voice: str = 'Cherry',
        language_type: str = 'Chinese'
    ) -> Dict[str, Any]:
        """
        调用TTS API合成语音
        基于官方MultiModalConversation接口
        
        Args:
            text: 要合成的文本
            voice: 声音类型（使用官方音色名称）
            language_type: 语言类型
            
        Returns:
            Dict: API响应结果
        """
        try:
            if not text or not text.strip():
                return {
                    'success': False,
                    'error': '文本内容不能为空',
                    'code': 400
                }
            
            # 根据官方文档构建请求参数 
            payload = {
                "model": self.model,  
                "input": {
                    "text": text.strip(),
                    "voice": voice,
                    "language_type": language_type  # 添加语言类型参数
                }
            }
            
            print(f"调用TTS API: {len(text)} 字符, 声音: {voice}, 语言: {language_type}")
            
            # 发送请求
            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload,
                timeout=60
            )
            
            # 检查HTTP状态码
            if response.status_code != 200:
                error_text = response.text
                try:
                    error_json = response.json()
                    error_msg = error_json.get('message', error_text)
                except:
                    error_msg = error_text
                    
                return {
                    'success': False,
                    'error': f'HTTP错误 {response.status_code}: {error_msg}',
                    'code': response.status_code,
                    'details': error_text
                }
            
            # 解析响应
            result = response.json()
            
            # 检查API响应状态 - 修复逻辑错误
            if 'output' in result and 'audio' in result['output']:
                output = result['output']
                audio_info = output['audio']
                
                if 'url' in audio_info and audio_info['url']:
                    print(f"✅ TTS合成成功!")
                    print(f"音频URL: {audio_info['url']}")
                    print(f"音频ID: {audio_info.get('id', 'N/A')}")
                    print(f"过期时间: {audio_info.get('expires_at', 'N/A')}")
                    
                    return {
                        'success': True,
                        'audio_url': audio_info['url'],
                        'audio_id': audio_info.get('id'),
                        'request_id': result.get('request_id', ''),
                        'usage': result.get('usage', {}),
                        'text_length': len(text),
                        'voice': voice,
                        'language_type': language_type,
                        'expires_at': audio_info.get('expires_at'),
                        'timestamp': datetime.now().isoformat()
                    }
                else:
                    print("❌ API响应中缺少音频URL")
                    return {
                        'success': False,
                        'error': 'API响应中缺少音频URL',
                        'code': 'MISSING_AUDIO_URL',
                        'details': result
                    }
            else:
                # API返回错误或格式不正确
                print(f"❌ API响应格式错误")
                print(f"响应内容: {json.dumps(result, indent=2, ensure_ascii=False)}")
                
                error_msg = result.get('message', '响应格式不正确')
                error_code = result.get('code', 'INVALID_RESPONSE')
                
                return {
                    'success': False,
                    'error': f'TTS API错误: {error_msg}',
                    'code': error_code,
                    'details': result
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'TTS API请求超时（60秒）',
                'code': 'TIMEOUT'
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'网络请求失败: {str(e)}',
                'code': 'NETWORK_ERROR'
            }
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error': f'响应解析失败: {str(e)}',
                'code': 'PARSE_ERROR'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'TTS合成失败: {str(e)}',
                'code': 'UNKNOWN_ERROR'
            }
    
    def get_voice_list(self) -> Dict[str, Any]:
        """
        获取支持的声音列表（基于官方文档）
        
        Returns:
            Dict: 声音列表
        """
        # Qwen3-TTS支持的音色（官方文档）
        qwen3_voices = {
            '通用音色': {
                'Cherry': '芊悦 - 阳光积极、亲切自然小姐姐',
                'Ethan': '晨煦 - 标准普通话，带部分北方口音。阳光、温暖、活力、朝气',
                'Nofish': '不吃鱼 - 不会翘舌音的设计师',
                'Jennifer': '詹妮弗 - 品牌级、电影质感般美语女声',
                'Ryan': '甜茶 - 节奏拉满，戏感炸裂，真实与张力共舞',
                'Katerina': '卡捷琳娜 - 御姐音色，韵律回味十足',
                'Elias': '墨讲师 - 既保持学科严谨性，又通过叙事技巧将复杂知识转化为可消化的认知模块'
            },
            '方言音色': {
                'Jada': '上海-阿珍 - 风风火火的沪上阿姐',
                'Dylan': '北京-晓东 - 北京胡同里长大的少年',
                'Sunny': '四川-晴儿 - 甜到你心里的川妹子',
                'Li': '南京-老李 - 耐心的瑜伽老师',
                'Marcus': '陕西-秦川 - 面宽话短，心实声沉——老陕的味道',
                'Roy': '闽南-阿杰 - 诙谐直爽、市井活泼的台湾哥仔形象',
                'Peter': '天津-李彼得 - 天津相声，专业捧人',
                'Rocky': '粤语-阿强 - 幽默风趣的阿强，在线陪聊',
                'Kiki': '粤语-阿清 - 甜美的港妹闺蜜',
                'Eric': '四川-程川 - 一个跳脱市井的四川成都男子'
            }
        }
        
        # 推荐的播客音色配置
        podcast_voices = {
            'male': 'Ethan',    # 男声：晨煦
            'female': 'Cherry'  # 女声：芊悦
        }
        
        return {
            'success': True,
            'qwen3_voices': qwen3_voices,
            'podcast_voices': podcast_voices,
            'total_count': sum(len(category) for category in qwen3_voices.values()),
            'categories': list(qwen3_voices.keys()),
            'supported_languages': [
                'Chinese', 'English', 'French', 'German', 'Russian', 
                'Italian', 'Spanish', 'Portuguese', 'Japanese', 'Korean'
            ]
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """
        测试API连接
        
        Returns:
            Dict: 测试结果
        """
        try:
            test_result = self.synthesize_speech(
                text="你好，这是语音合成测试",
                voice='Cherry',
                language_type='Chinese'
            )
            
            return {
                'success': test_result['success'],
                'message': '连接测试完成',
                'api_available': test_result['success'],
                'error': test_result.get('error') if not test_result['success'] else None,
                'test_audio_url': test_result.get('audio_url') if test_result['success'] else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'message': '连接测试失败',
                'api_available': False,
                'error': str(e)
            }