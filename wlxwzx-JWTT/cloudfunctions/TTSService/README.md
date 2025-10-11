# TTSService 云函数说明

## 功能概述
- 单一职责：只负责调用 TTS 提供方进行语音合成，生成最小必要元数据并通过 API 网关回调 content-api 的 /tts/done。
- 不负责存储：不再直接上传云存储；文件下载与入库由 content-api 负责。
- 支持两种音频类型：
  - original：原文朗读（女声默认 Cherry）
  - podcast：播客对话（男声 Ethan + 女声 Cherry 交替）

## 运行环境与依赖
- 运行时：Python 3.9
- 依赖（已在函数目录打包，避免 OpenSSL 兼容问题）
  - requests==2.31.0
  - urllib3==1.26.20
  - certifi==2023.11.17
  - charset-normalizer==3.4.3
  - idna==3.10

## 环境变量
- DASHSCOPE_API_KEY：通义千问 TTS API 密钥
- URL：通义千问 TTS API 地址
- MODEL：通义千问 TTS 模型名
- TENCENTCLOUD_ENV_ID：当前云开发环境 ID（用于拼装 API 网关地址）
- CLOUDBASE_API_KEY：用于回调 content-api 的 Bearer Token（联调阶段可在 content-api 侧临时关闭鉴权）

## 接口说明

### 触发方式
TTSService 云函数可以通过以下方式触发：
1. 通过 content-api 的 /tts/generate 接口异步触发
2. 直接调用云函数

### 请求参数
```json
{
  "content_id": "内容ID",
  "audio_type": "original | podcast"
}
```

### 响应格式
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    "audio_urls": [
      {
        "segment_index": 0,
        "voice_type": "female",
        "voice": "Cherry",
        "temp_url": "https://provider/xxx.wav",
        "text_length": 300,
        "expires_at": 1759935069,
        "request_id": "provider_request_id"
      }
    ],
    "total_segments": 1,
    "success_rate": 100
  },
  "timestamp": "ISO8601时间戳"
}
```

## 回调流程
1. 合成完成后，TTSService 通过 HTTP 网关调用 content-api：
   - POST https://{env-id}.api.tcloudbasegateway.com/v1/functions/content-api
   - 请求体为云函数 HTTP 事件格式：
     ```json
     {
       "path": "/tts/done",
       "httpMethod": "POST",
       "headers": {"Content-Type":"application/json"},
       "queryStringParameters": {},
       "body": "{...回调业务JSON字符串...}",
       "isBase64Encoded": false
     }
     ```
   - Headers: Authorization: Bearer {CLOUDBASE_API_KEY}

2. 回调业务 JSON（body 反序列化后），示例：
   ```json
   {
     "task_id": "CONTENT_ID-UNIX_TS",
     "content_id": "CONTENT_ID",
     "audio_type": "original | podcast",
     "audio_urls": [
       // original 条目
       {
         "segment_index": 0,
         "voice": "Cherry",
         "temp_url": "https://provider/xxx.wav",
         "expires_at": 1759935069,
         "text_length": 300,
         "request_id": "provider_request_id"
       }
       // podcast 条目（男女声交替）
       // {
       //   "segment_index": 0 | 1 | ...,
       //   "voice_type": "male | female",
       //   "voice": "Ethan | Cherry",
       //   "temp_url": "https://provider/xxx.wav",
       //   "expires_at": 1759935069,
       //   "text_length": 120,
       //   "request_id": "provider_request_id"
       // }
     ],
     "processing_time": 1.23,
     "timestamp": "ISO8601"
   }
   ```

说明：
- 不再包含 planned_cloud_path/filename/content_type（这些由 content-api 侧决定）
- original 与 podcast 均补齐 expires_at 与 request_id（来自提供方响应）

## 测试模板
测试模板会在测试时作为event参数传递给函数，模板列表中包含了对各触发器事件的模拟数据结构：

### 直接调用 synthesize 测试模板
```json
{
  "content_id": "test_content_123",
  "audio_type": "original"
}
```

### API 连通性测试模板
```json
{
  "api_test": true
}
```

### 通过 content-api /tts/generate 触发测试模板
```json
{
  "path": "/tts/generate",
  "httpMethod": "POST",
  "body": "{\"content_id\": \"test_content_123\", \"audio_type\": \"original\"}"
}
```

## 日志要点
- 回调鉴权日志仅打印 token 是否存在与长度，不打印明文
- 发生 HTTP 异常时打印状态码与前 512 字符响应体片段，便于定位

## 变更日志（摘要）
- 2025-10-07
  - 职责收敛：仅合成并回传最小元数据；删除 planned_cloud_path
  - podcast 分支为 male/female 条目补齐 expires_at 与 request_id
  - 通过 API 网关回调 content-api，采用 Bearer 鉴权（可阶段性关闭）