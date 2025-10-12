# PodcastGeneratorService 播客生成服务

## 服务说明

PodcastGeneratorService 是一个播客稿生成和TTS拆分服务，负责调用AI模型生成播客稿内容，并将其拆分为适合TTS合成的格式。

## 功能特性

- AI播客稿生成
- 播客内容解析和验证
- TTS拆分处理（单双索引分组）
- 多种播客风格支持

## API接口

### 请求URL
```
POST /podcast
```

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| content_id | string | 是 | 内容记录ID |
| style | string | 否 | 播客风格（默认：科普风格） |

### 响应格式
```json
{
  "success": true,
  "code": 200,
  "message": "播客生成成功",
  "data": {
    "content_id": "内容记录ID",
    "podcast": {
      "title": "播客标题",
      "content": ["播客对话内容数组"]
    },
    "tts_podcast": [
      ["男声对话段落"],
      ["女声对话段落"]
    ],
    "tts_statistics": {
      "total_segments": "总分段数",
      "average_length": "平均段落长度",
      "max_length": "最大段落长度",
      "min_length": "最小段落长度"
    },
    "style": "播客风格",
    "generation_time": "生成耗时（秒）",
    "timestamp": "时间戳"
  }
}
```

## 测试模板

在本地测试时，可以使用以下测试模板作为event参数：

```json
{
  "content_id": "test_content_123",
  "style": "科普风格"
}
```

不带风格参数的测试：

```json
{
  "content_id": "test_content_123"
}
```

## 本地测试

```bash
python index.py
```

## 部署方式

通过云开发控制台或CLI工具部署：
```bash
tcb framework deploy
```