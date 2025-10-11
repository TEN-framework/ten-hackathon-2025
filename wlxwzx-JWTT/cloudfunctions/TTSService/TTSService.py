#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TTSService - 语音合成服务
负责调用AI模型进行文本到语音的转换，并管理生成的音频文件
"""

import json
import time
import os
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional

from config import (
    TTS_CONFIG,
    AUDIO_CONFIG,
    ERROR_CONFIG,
    LOGGING_CONFIG
)
# 导入API配置
from api_config import CLOUDBASE_API_KEY, API_GATEWAY_URL_TEMPLATE
from QwenTTSClient import QwenTTSClient
# 移除存储工具依赖，改为仅返回音频元信息，由 content-api 负责下载与上传


class TTSService:
    """TTS服务主类"""
    
    def __init__(self):
        self.verbose = LOGGING_CONFIG['VERBOSE']
        # 初始化TTS客户端 - 使用环境变量中的API密钥
        api_key = os.environ.get('DASHSCOPE_API_KEY')
        url =  os.environ.get('URL')
        model = os.environ.get('MODEL') 


        self.tts_client = QwenTTSClient(api_key,url,model)
        # 本服务不负责存储，仅返回音频元信息
    
    def _get_content_data(self, content_id: str) -> Dict[str, Any]:
        """
        获取原文内容数据
        
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
                    # 修正：使用正确的云函数调用路径
                    function_url = f"{api_gateway_url}/v1/functions/content-api"
                    
                    # 设置请求头，包含API Key认证
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {CLOUDBASE_API_KEY}'
                    }
                    
                    # 构造请求数据，调用content-api的/content/{id}路径
                    payload = {
                        "path": f"/content/{content_id}",
                        "httpMethod": "GET",
                        "headers": {"Content-Type": "application/json"},
                        "queryStringParameters": {},
                        "body": "",
                        "isBase64Encoded": False
                    }
                    
                    # 发送HTTP POST请求调用云函数
                    response = requests.post(function_url, headers=headers, json=payload, timeout=30)
                    try:
                        # 先记录状态码与响应片段，便于定位 400 详情
                        print(f"[content-api GET] status={response.status_code}")
                        # 仅输出前512字符避免刷屏
                        _resp_text = None
                        try:
                            _resp_text = response.text
                            if isinstance(_resp_text, str) and len(_resp_text) > 512:
                                _resp_text = _resp_text[:512] + "...<truncated>"
                        except Exception:
                            _resp_text = "<no text>"
                        print(f"[content-api GET] body: {_resp_text}")
                    except Exception:
                        pass

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
                                # 修复：增加字段存在性检查，避免KeyError
                                content_data = body_data['data']
                                return {
                                    'success': True,
                                    'data': {
                                        'id': content_data.get('id', ''),
                                        '_id': content_data.get('_id', ''),
                                        '_openid': content_data.get('_openid', ''),
                                        'title': content_data.get('title', '未知标题'),
                                        'content': content_data.get('content', ''),
                                        'url': content_data.get('url', ''),
                                        'tts_content': content_data.get('tts_content', []),
                                        'tts_podcast': content_data.get('tts_podcast', [])
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
                    # 增强错误日志，打印可能的响应详情
                    try:
                        resp = getattr(http_error, 'response', None)
                        if resp is not None:
                            print(f"[content-api GET] exception status={resp.status_code}")
                            try:
                                _t = resp.text
                                if isinstance(_t, str) and len(_t) > 512:
                                    _t = _t[:512] + "...<truncated>"
                                print(f"[content-api GET] exception body: {_t}")
                            except Exception:
                                pass
                    except Exception:
                        pass
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
            error_msg = f"获取内容数据失败: {str(e)}"
            print(error_msg)
            return {
                'success': False,
                'message': error_msg,
                'error': str(e)
            }
    
    def synthesize_audio(self, content_id: str, audio_type: str) -> Dict[str, Any]:
        """
        合成音频文件
        
        Args:
            content_id: 内容记录ID
            audio_type: 音频类型 (original/podcast)
            
        Returns:
            Dict: 音频合成结果
        """
        try:
            start_time = time.time()
            
            if self.verbose:
                print(f"开始合成音频，内容ID: {content_id}, 类型: {audio_type}")
            
            # 1. 参数验证
            if not content_id or not isinstance(content_id, str):
                return self._create_error_response(
                    400,
                    "content_id参数不能为空且必须是字符串",
                    {"content_id": content_id}
                )
            
            if audio_type not in ['original', 'podcast']:
                return self._create_error_response(
                    400,
                    "audio_type必须是original或podcast",
                    {"audio_type": audio_type}
                )
            
            # 2. 获取内容数据
            content_result = self._get_content_data(content_id)
            if not content_result['success']:
                return content_result
            
            content_data = content_result['data']
            
            # 3. 根据类型处理内容
            if audio_type == 'original':
                result = self._synthesize_original_audio(content_data)
            else:  # podcast
                result = self._synthesize_podcast_audio(content_data)
            
            if not result['success']:
                return result
            
            # 4. 构建完整结果（加入 task_id 供回调与后续处理关联）
            final_result = {
                'task_id': f"{content_id}-{int(time.time())}",
                'content_id': content_id,
                'audio_type': audio_type,
                'audio_urls': result['data']['audio_urls'],
                'processing_time': round(time.time() - start_time, 2),
                'timestamp': datetime.now().isoformat()
            }
            
            if self.verbose:
                print(f"音频合成完成: {len(result['data']['audio_urls'])}个文件, "
                      f"{final_result['processing_time']}秒")
            try:
                # 合成完成后，异步回调 content-api 进行后续处理
                self._post_callback(final_result)
            except Exception as cb_err:
                print(f"回调通知失败: {cb_err}")
            return self._create_success_response(final_result, "音频合成成功（已触发异步回调）")
            
        except Exception as e:
            error_msg = f"音频合成失败: {str(e)}"
            print(error_msg)
            return self._create_error_response(500, error_msg, {"content_id": content_id, "error": str(e)})
    
    def _call_qwen_tts_api(self, text: str, voice: str, language_type: str = 'Chinese') -> Dict[str, Any]:
        """
        调用通义千问TTS API
        
        Args:
            text: 要合成的文本
            voice: 声音类型（官方音色名称）
            language_type: 语言类型
            
        Returns:
            Dict: TTS API调用结果
        """
        try:
            result = self.tts_client.synthesize_speech(
                text=text,
                voice=voice,
                language_type=language_type
            )
            return result
        except Exception as e:
            return {
                'success': False,
                'error': f'调用TTS API失败: {str(e)}',
                'code': 'TTS_API_ERROR'
            }
    
    def _prepare_audio_info(self, audio_url: str, content_id: str, openid: str = "", record_id: str = "", segment_index: int = 0, audio_type: str = "original") -> Dict[str, Any]:
        """
        准备音频文件信息（仅返回元数据，不做上传）
        - 生成建议的云存储路径：{openid}/{record_id}/{yw|bk}/filename.wav
        """
        try:
            path_type = 'yw' if audio_type == 'original' else 'bk'
            ts = datetime.now().isoformat().replace(':', '-').replace('.', '-')
            filename = f"audio_{segment_index}_{ts}.wav"
            cloud_path = f"{(openid or 'anonymous')}/{(record_id or content_id)}/{path_type}/{filename}"
            return {
                'success': True,
                'temp_url': audio_url,
                'cloud_path': cloud_path,
                'filename': filename,
                'content_type': 'audio/wav',
                'segment_index': segment_index,
                'audio_type': audio_type
            }
        except Exception as e:
            return {'success': False, 'error': f'音频信息准备失败: {str(e)}', 'code': 'PREPARE_ERROR'}
    
    def _synthesize_original_audio(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        合成原文音频
        
        Args:
            content_data: 原文内容数据
            
        Returns:
            Dict: 合成结果
        """
        try:
            if self.verbose:
                print("开始合成原文音频...")
            
            # 获取TTS内容分段
            tts_content = content_data.get('tts_content', [])
            if not tts_content:
                # 如果没有预分段，则直接使用原文内容
                content = content_data.get('content', '')
                if not content:
                    return self._create_error_response(
                        422,
                        "原文内容为空，无法生成音频",
                        {"content_id": content_data.get('id')}
                    )
                # 简单分段处理（实际应使用更复杂的分段逻辑）
                tts_content = [content[i:i+500] for i in range(0, len(content), 500) if content[i:i+500].strip()]
            
            if not tts_content:
                return self._create_error_response(
                    422,
                    "TTS内容分段为空",
                    {"content_id": content_data.get('id')}
                )
            
            # 调用实际的TTS API合成音频
            audio_urls = []
            total_segments = len(tts_content)
            
            if self.verbose:
                print(f"开始合成 {total_segments} 个音频片段...")
            
            for i, segment in enumerate(tts_content):
                if not segment.strip():
                    continue
                    
                try:
                    # 调用通义千问TTS API
                    audio_result = self._call_qwen_tts_api(
                        text=segment.strip(),
                        voice='Cherry',  # 默认女声：芊悦
                        language_type='Chinese'
                    )
                    
                    if audio_result['success']:
                        # 准备音频文件信息，实际上传由content-api处理
                        storage_result = self._prepare_audio_info(
                            audio_url=audio_result['audio_url'],
                            content_id=content_data.get('id', 'unknown'),
                            openid=content_data.get('_openid', ''),
                            record_id=content_data.get('_id', ''),
                            segment_index=i,
                            audio_type='original'
                        )
                        
                        if storage_result['success']:
                            audio_urls.append({
                                'segment_index': i,
                                'voice': 'Cherry',
                                'temp_url': storage_result.get('temp_url') or audio_result.get('audio_url'),
                                'cloud_path': storage_result.get('cloud_path'),
                                'filename': storage_result.get('filename'),
                                'content_type': storage_result.get('content_type', 'audio/wav'),
                                'text_length': len(segment.strip()),
                                'expires_at': audio_result.get('expires_at'),
                                'request_id': audio_result.get('request_id', '')
                            })
                            if self.verbose:
                                print(f"片段 {i+1}/{total_segments} TTS合成并上传完成")
                        else:
                            print(f"片段 {i+1} 上传失败: {storage_result.get('error')}")
                            
                    else:
                        print(f"片段 {i+1} TTS合成失败: {audio_result.get('error')}")
                        
                except Exception as segment_error:
                    print(f"处理片段 {i+1} 时出错: {str(segment_error)}")
                    continue
            
            if not audio_urls:
                return self._create_error_response(
                    500,
                    "所有音频片段合成失败",
                    {"content_id": content_data.get('id'), "total_segments": total_segments}
                )
            
            result_data = {
                'audio_urls': audio_urls,
                'segment_count': len(audio_urls),
                'total_segments': total_segments,
                'success_rate': round(len(audio_urls) / total_segments * 100, 2)
            }
            
            return self._create_success_response(result_data, f"原文音频合成完成，成功率: {result_data['success_rate']}%")
            
        except Exception as e:
            return self._create_error_response(
                500,
                f"原文音频合成失败: {str(e)}",
                {"error": str(e)}
            )
    
    def _synthesize_podcast_audio(self, content_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        合成播客音频
        
        Args:
            content_data: 播客内容数据
            
        Returns:
            Dict: 合成结果
        """
        try:
            if self.verbose:
                print("开始合成播客音频...")
            
            # 获取播客TTS内容
            tts_podcast = content_data.get('tts_podcast', [])
            if not tts_podcast or len(tts_podcast) != 2:
                return self._create_error_response(
                    422,
                    "播客TTS内容格式不正确，应为包含男女声的二维数组",
                    {"content_id": content_data.get('id'), "tts_podcast_length": len(tts_podcast) if tts_podcast else 0}
                )
            
            # 播客音频生成 - 交替合成男女声
            audio_urls = []
            male_segments = tts_podcast[0]  # 男声片段
            female_segments = tts_podcast[1]  # 女声片段
            
            # 确保两个说话者的片段数量一致
            max_segments = max(len(male_segments), len(female_segments))
            
            if self.verbose:
                print(f"开始合成播客音频，男声 {len(male_segments)} 片段，女声 {len(female_segments)} 片段")
            
            # 交替生成音频：男声[0], 女声[0], 男声[1], 女声[1]...
            for i in range(max_segments):
                # 处理男声（如果存在）
                if i < len(male_segments) and male_segments[i].strip():
                    try:
                        male_result = self._call_qwen_tts_api(
                            text=male_segments[i].strip(),
                            voice='Ethan',  # 男声：晨煦
                            language_type='Chinese'
                        )
                        
                        if male_result['success']:
                            storage_result = self._prepare_audio_info(
                                audio_url=male_result['audio_url'],
                                content_id=content_data.get('id', 'unknown'),
                                openid=content_data.get('_openid', ''),
                                record_id=content_data.get('_id', ''),
                                segment_index=i,
                                audio_type='podcast'
                            )
                            
                            if storage_result['success']:
                                audio_urls.append({
                                    'segment_index': i * 2,
                                    'voice_type': 'male',
                                    'voice': 'Ethan',
                                    'temp_url': storage_result.get('temp_url') or male_result.get('audio_url'),
                                    'cloud_path': storage_result.get('cloud_path'),
                                    'filename': storage_result.get('filename'),
                                    'content_type': storage_result.get('content_type', 'audio/wav'),
                                    'text_length': len(male_segments[i].strip()),
                                    'expires_at': male_result.get('expires_at'),
                                    'request_id': male_result.get('request_id', '')
                                })
                                if self.verbose:
                                    print(f"男声片段 {i+1} 合成完成")
                            else:
                                print(f"男声片段 {i+1} 上传失败: {storage_result.get('error')}")
                        else:
                            print(f"男声片段 {i+1} TTS合成失败: {male_result.get('error')}")
                            
                    except Exception as male_error:
                        print(f"处理男声片段 {i+1} 时出错: {str(male_error)}")
                
                # 处理女声（如果存在）
                if i < len(female_segments) and female_segments[i].strip():
                    try:
                        female_result = self._call_qwen_tts_api(
                            text=female_segments[i].strip(),
                            voice='Cherry',  # 女声：芊悦
                            language_type='Chinese'
                        )
                        
                        if female_result['success']:
                            storage_result = self._prepare_audio_info(
                                audio_url=female_result['audio_url'],
                                content_id=content_data.get('id', 'unknown'),
                                openid=content_data.get('_openid', ''),
                                record_id=content_data.get('_id', ''),
                                segment_index=i,
                                audio_type='podcast'
                            )
                            
                            if storage_result['success']:
                                audio_urls.append({
                                    'segment_index': i * 2 + 1,
                                    'voice_type': 'female',
                                    'voice': 'Cherry',
                                    'temp_url': storage_result.get('temp_url') or female_result.get('audio_url'),
                                    'cloud_path': storage_result.get('cloud_path'),
                                    'filename': storage_result.get('filename'),
                                    'content_type': storage_result.get('content_type', 'audio/wav'),
                                    'text_length': len(female_segments[i].strip()),
                                    'expires_at': female_result.get('expires_at'),
                                    'request_id': female_result.get('request_id', '')
                                })
                                if self.verbose:
                                    print(f"女声片段 {i+1} 合成完成")
                            else:
                                print(f"女声片段 {i+1} 上传失败: {storage_result.get('error')}")
                        else:
                            print(f"女声片段 {i+1} TTS合成失败: {female_result.get('error')}")
                            
                    except Exception as female_error:
                        print(f"处理女声片段 {i+1} 时出错: {str(female_error)}")
            
            if not audio_urls:
                return self._create_error_response(
                    500,
                    "所有播客音频片段合成失败",
                    {"content_id": content_data.get('id'), "male_segments": len(male_segments), "female_segments": len(female_segments)}
                )
            
            result_data = {
                'audio_urls': audio_urls,
                'total_segments': len(audio_urls),
                'male_segment_count': len(male_segments),
                'female_segment_count': len(female_segments),
                'success_rate': round(len(audio_urls) / (len(male_segments) + len(female_segments)) * 100, 2)
            }
            
            return self._create_success_response(result_data, f"播客音频合成完成，成功率: {result_data['success_rate']}%")
            
        except Exception as e:
            return self._create_error_response(
                500,
                f"播客音频合成失败: {str(e)}",
                {"error": str(e)}
            )
    
    def _post_callback(self, final_result: Dict[str, Any]) -> None:
        """
        异步回调 content-api 的 /tts/done
        通过 API 网关 HTTP 接口调用 content-api 云函数
        """
        try:
            env_id = os.environ.get('TENCENTCLOUD_ENV_ID', 'cloud1-8grkg0ar5f169249')
            api_gateway_url = API_GATEWAY_URL_TEMPLATE.format(env_id=env_id)
            function_url = f"{api_gateway_url}/v1/functions/content-api"
            # 安全日志：仅记录是否存在与长度，避免打印明文
            try:
                _token_len = len(CLOUDBASE_API_KEY or "")
                print(f"TTSService 回调鉴权: token_len={_token_len}, has_token={bool(CLOUDBASE_API_KEY)}")
            except Exception:
                pass
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {CLOUDBASE_API_KEY}'
            }
            payload = {
                "path": "/tts/done",
                "httpMethod": "POST",
                "headers": {"Content-Type": "application/json"},
                "queryStringParameters": {},
                "body": json.dumps(final_result, ensure_ascii=False),
                "isBase64Encoded": False
            }
            resp = requests.post(function_url, headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            try:
                print(f"✅ 已回调 content-api /tts/done, status={resp.status_code}")
                # 打印响应文本，便于联调定位
                print(f"content-api 回应: {resp.text}")
            except Exception as log_err:
                print(f"回调日志打印异常: {log_err}")
        except Exception as e:
            # 打印更多上下文信息，便于定位
            try:
                if 'resp' in locals():
                    print(f"回调失败，status={getattr(resp,'status_code',None)}, text={getattr(resp,'text',None)}")
            except Exception:
                pass
            print(f"❌ 异步回调失败: {e}")

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
            'service_name': 'TTSService',
            'version': '1.0.0',
            'description': '文本到语音合成服务',
            'features': [
                '原文TTS合成',
                '播客TTS合成',
                '音频文件管理'
            ],
            'configuration': {
                'supported_audio_types': ['original', 'podcast']
            }
        }