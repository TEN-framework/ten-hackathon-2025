# content-api 云函数说明

## 功能概述
- 统一 API 网关：路由分发、校验、响应格式化
- 职责：下载/上传音频至云存储、数据库落库、查询接口
- 与 TTSService 的关系：接受其 /tts/done 回调载荷并完成后续处理

## 运行环境与依赖
- 运行时：Node.js >=18.15.0
- 依赖：
  - @cloudbase/node-sdk: ^2.4.1
  - cors: ^2.8.5
  - node-fetch: ^2.6.7

## 路由一览
- POST /extract
- POST /podcast
- POST /tts/generate（异步：立即返回 202 + 写入任务状态）
- POST /tts/done（回调：上传 + 入库）
- GET /content/{id}
- GET /history
- GET /health

## 接口说明

### POST /extract - 内容提取接口
从指定URL提取网页内容并保存到数据库。

**请求参数：**
```json
{
  "url": "https://example.com/article",
  "options": {
    "timeout": 10000,
    "headers": {
      "User-Agent": "Mozilla/5.0..."
    }
  }
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "内容提取成功",
  "data": {
    "id": "content_record_id",
    "url": "https://example.com/article",
    "title": "文章标题",
    "content": "文章内容...",
    "content_length": 1234,
    "tts_content": ["分段1", "分段2"],
    "tts_statistics": {
      "segments": 2,
      "total_chars": 1234
    },
    "extraction_time": 0.45,
    "timestamp": "2025-10-08T10:30:00.000Z",
    "_openid": "user_openid"
  },
  "request_id": "req_1234567890",
  "timestamp": 1759935000000,
  "success": true
}
```

### POST /podcast - 播客生成接口
基于已提取的内容生成播客对话内容。

**请求参数：**
```json
{
  "content_id": "content_record_id",
  "style": "科普风格"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "播客生成成功",
  "data": {
    "podcast": [
      {
        "speaker": "男声",
        "content": "欢迎收听本期节目..."
      },
      {
        "speaker": "女声",
        "content": "今天我们来聊聊..."
      }
    ],
    "tts_podcast": ["播客分段1", "播客分段2"]
  },
  "request_id": "req_1234567890",
  "timestamp": 1759935000000,
  "success": true
}
```

### POST /tts/generate - TTS生成接口（异步）
触发TTS语音合成任务，立即返回处理中状态。

**请求参数：**
```json
{
  "content_id": "content_record_id",
  "audio_type": "original | podcast"
}
```

**响应示例：**
```json
{
  "success": true,
  "code": 202,
  "message": "TTS任务已开始处理",
  "data": {
    "task_id": "content_record_id-1759935000000",
    "status": "TTS_PROCESSING",
    "content_id": "content_record_id",
    "audio_type": "original"
  },
  "requestId": "req_1234567890"
}
```

### POST /tts/done - TTS回调接口
接收TTSService的回调，处理音频文件上传和数据库更新。

**请求参数：**
```json
{
  "task_id": "CONTENT_ID-UNIX_TS",
  "content_id": "CONTENT_ID",
  "audio_type": "original | podcast",
  "audio_urls": [
    {
      "segment_index": 0,
      "voice_type": "female",
      "voice": "Cherry",
      "temp_url": "https://provider/xxx.wav",
      "expires_at": 1759935069,
      "text_length": 300,
      "request_id": "provider_request_id"
    }
  ]
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "TTS回调处理完成",
  "data": {
    "task_id": "content_record_id-1759935000000",
    "content_id": "content_record_id",
    "audio_type": "original",
    "audio_urls": [
      {
        "segment_index": 0,
        "voice_type": "female",
        "voice": "Cherry",
        "file_id": "cloud://env-id/file-id",
        "cloud_path": "openid/recordId/yw/audio_0_1759935000000.wav",
        "download_url": "https://temp-url...",
        "file_size": 12345,
        "text_length": 300,
        "upload_time": "2025-10-08T10:30:00.000Z",
        "source": {
          "temp_url": "https://provider/xxx.wav",
          "expires_at": 1759935069,
          "provider_request_id": "provider_request_id"
        }
      }
    ],
    "storage_path": "openid/recordId/yw",
    "db_updated": true
  },
  "request_id": "req_1234567890",
  "timestamp": 1759935000000,
  "success": true
}
```

### GET /content/{id} - 获取内容详情
根据内容ID获取详细信息。

**响应示例：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "id": "content_record_id",
    "_id": "content_record_id",
    "_openid": "user_openid",
    "url": "https://example.com/article",
    "title": "文章标题",
    "content": "文章内容...",
    "content_length": 1234,
    "tts_content": ["分段1", "分段2"],
    "tts_podcast": ["播客分段1", "播客分段2"],
    "podcast": [
      {
        "speaker": "男声",
        "content": "欢迎收听..."
      }
    ],
    "ttsc_url": [...],
    "ttsp_url": [...],
    "ttsc_task": {
      "status": "completed",
      "started_at": "2025-10-08T10:30:00.000Z",
      "finished_at": "2025-10-08T10:31:00.000Z",
      "duration_ms": 60000
    },
    "ttsp_task": {
      "status": "completed",
      "started_at": "2025-10-08T10:32:00.000Z",
      "finished_at": "2025-10-08T10:33:00.000Z",
      "duration_ms": 60000
    },
    "status": "completed",
    "processing_stage": "completed",
    "created_at": "2025-10-08T10:00:00.000Z",
    "updated_at": "2025-10-08T10:33:00.000Z",
    "timestamp": "2025-10-08T10:00:00.000Z"
  },
  "request_id": "req_1234567890",
  "timestamp": 1759935000000,
  "success": true
}
```

### GET /history - 获取历史记录
获取内容提取历史记录。

**请求参数：**
- limit: 10 (可选，默认10)
- offset: 0 (可选，默认0)

**响应示例：**
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "content_record_id",
        "url": "https://example.com/article",
        "title": "文章标题",
        "content_length": 1234,
        "status": "completed",
        "processing_stage": "completed",
        "created_at": "2025-10-08T10:00:00.000Z",
        "updated_at": "2025-10-08T10:33:00.000Z"
      }
    ],
    "total": 1,
    "limit": 10,
    "offset": 0
  },
  "request_id": "req_1234567890",
  "timestamp": 1759935000000,
  "success": true
}
```

### GET /health - 健康检查
检查服务健康状态。

**响应示例：**
```json
{
  "code": 200,
  "message": "服务健康状态正常",
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-08T10:30:00.000Z",
    "version": "1.0.0",
    "services": {
      "database": "healthy",
      "api_gateway": "healthy"
    }
  },
  "request_id": "req_1234567890",
  "timestamp": 1759935000000,
  "success": true
}
```

## /tts/generate（异步触发）
- 入参：
```json
{
  "content_id": "xxx",
  "audio_type": "original | podcast",
  "voice_config": { ... 可选 ... }
}
```
- 返回：202 + task_id，并写入 ttsc_task 或 ttsp_task = {status:'processing', started_at: ISO}

## /tts/done（回调处理）
- 鉴权：Authorization: Bearer {CLOUDBASE_API_KEY}
  - 联调阶段可临时关闭；验收后恢复
  - 恢复后可兼容 body.auth_token 兜底
- 入参（TTSService 提供最小元数据）：
```json
{
  "task_id": "CONTENT_ID-UNIX_TS",
  "content_id": "CONTENT_ID",
  "audio_type": "original | podcast",
  "audio_urls": [
    // original
    {
      "segment_index": 0,
      "voice": "Cherry",
      "temp_url": "https://provider/xxx.wav",
      "expires_at": 1759935069,
      "text_length": 300,
      "request_id": "provider_request_id"
    }
    // podcast（男女声交替）
    // {
    //   "segment_index": 0 | 1 | ...,
    //   "voice_type": "male | female",
    //   "voice": "Ethan | Cherry",
    //   "temp_url": "https://provider/xxx.wav",
    //   "expires_at": 1759935069,
    //   "text_length": 120,
    //   "request_id": "provider_request_id"
    // }
  ]
}
```
- 处理流程：
  1) 下载每条 temp_url
  2) 生成 cloud_path 并上传
     - 规则：{openid}/{recordId}/(yw|bk)/audio_{segment_index}{_voiceType}_{timestamp}.wav
       - original → yw；podcast → bk
  3) 获取 download_url 与 file_id
  4) 更新数据库（仅更新本次传入字段；不会清空未传字段）
- 返回示例（关键结构）：
```json
{
  "success": true,
  "code": 200,
  "message": "TTS回调处理完成",
  "data": {
    "task_id": "...",
    "content_id": "...",
    "audio_type": "original | podcast",
    "audio_urls": [
      {
        "segment_index": 0,
        "voice_type": "male|female" (pod客 时存在),
        "voice": "Ethan|Cherry" (可选),
        "file_id": "cloud://.../file-id",
        "cloud_path": "OPENID/RECORDID/(yw|bk)/audio_0_....wav",
        "download_url": "https://...temp-url",
        "file_size": 12345,
        "text_length": 300,
        "upload_time": "ISO",
        "source": {
          "temp_url": "https://provider/xxx.wav",
          "expires_at": 1759935069,
          "provider_request_id": "provider_request_id"
        }
      }
    ],
    "storage_path": "OPENID/RECORDID/(yw|bk)",
    "db_updated": true
  }
}
```

## 数据库存储字段（extracted_contents）
- ttsc_url：原文 TTS 最终文件数组（见上）
- ttsp_url：播客 TTS 最终文件数组（见上）
- ttsc_task / ttsp_task：{ status, started_at?, finished_at?, duration_ms? }
- 说明：不再写入 ttsc_temp_url / ttsp_temp_url；临时信息合并至每条目 source

## cloud_path 生成规则
- 目录前缀：{openid}/{recordId}/(yw|bk)
  - audio_type=original → yw
  - audio_type=podcast → bk
- 文件名：audio_{segment_index}{_voiceType}_{timestamp}.wav（timestamp 使用 ISO 去除冒号/点）
- 组合：cloud_path = `${openid}/${recordId}/${pathType}/${filename}`

## 环境变量
- CLOUDBASE_API_KEY：/tts/done 鉴权（生产启用）

## 部署与注意事项
- 本函数 Node.js 环境；更新代码后通过工具更新函数代码
- 已修复：
  - 模板字符串语法错误导致冷启动异常
  - 使用 cloud.getCloudbaseContext(context) 获取上下文
  - 路由传入 context，避免 INVALID_CONTEXT
  - updateTTSData 仅更新传入字段，避免清空未传字段
  - 统一 source 三键；缺失由 TTSService 提供（不在此处兜底）

## 测试模板
测试模板会在测试时作为event参数传递给函数，模板列表中包含了对各触发器事件的模拟数据结构：

### /extract 接口测试模板
```json
{
  "path": "/extract",
  "httpMethod": "POST",
  "body": "{\"url\": \"https://example.com/article\"}"
}
```

### /podcast 接口测试模板
```json
{
  "path": "/podcast",
  "httpMethod": "POST",
  "body": "{\"content_id\": \"content_record_id\", \"style\": \"科普风格\"}"
}
```

### /tts/generate 接口测试模板
```json
{
  "path": "/tts/generate",
  "httpMethod": "POST",
  "body": "{\"content_id\": \"test_content_123\", \"audio_type\": \"original\"}"
}
```

### /tts/done 回调测试模板
```json
{
  "path": "/tts/done",
  "httpMethod": "POST",
  "body": "{\"task_id\": \"ade3e4...-1759847507\", \"content_id\": \"ade3e4...\", \"audio_type\": \"podcast\", \"audio_urls\": [{\"segment_index\": 0, \"voice_type\": \"male\", \"voice\": \"Ethan\", \"temp_url\": \"http://provider/xxx.wav?Expires=1759933903...\", \"expires_at\": 1759933903, \"text_length\": 10, \"request_id\": \"c9bf1d38-....\"}, {\"segment_index\": 1, \"voice_type\": \"female\", \"voice\": \"Cherry\", \"temp_url\": \"http://provider/yyy.wav?Expires=1759933904...\", \"expires_at\": 1759933904, \"text_length\": 10, \"request_id\": \"457675a4-....\"}]}"
}
```

### /content/{id} 接口测试模板
```json
{
  "path": "/content/content_record_id",
  "httpMethod": "GET"
}
```

### /history 接口测试模板
```json
{
  "path": "/history",
  "httpMethod": "GET",
  "queryStringParameters": {
    "limit": "10",
    "offset": "0"
  }
}
```

### /health 接口测试模板
```json
{
  "path": "/health",
  "httpMethod": "GET"
}
```

## 变更日志
- 2025-10-07
  - 统一 ttsp_url/ttsc_url 条目的 source 三键（temp_url、expires_at、provider_request_id）
  - 仅更新本次传入字段，避免清空未传字段；storage_path 使用 data.id；修复上下文与鉴权策略（分阶段）
- v0.7.x
  - 职责分离 + 异步回调；合并 temp_url/expires_at 至 source；移除 ttsc_temp_url/ttsp_temp_url；引入 ttsc_task/ttsp_task；由 content-api 生成权威 cloud_path