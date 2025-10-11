# ContentExtractorService 内容提取服务

## 服务说明

ContentExtractorService 是一个网页内容提取和TTS文本分段服务，负责从网页URL中提取正文内容，并将其分段处理以供后续TTS合成使用。

## 功能特性

- 网页内容智能提取
- 内容清洗和规范化
- TTS文本分段处理
- 内容质量验证
- 统计信息生成

## API接口

### 请求URL
```
POST /extract
```

### 请求参数
| 参数名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| url | string | 是 | 网页URL |
| options | object | 否 | 提取选项配置 |

### 响应格式
```json
{
  "success": true,
  "code": 200,
  "message": "内容提取成功",
  "data": {
    "id": "内容记录ID（数据库保存后生成）",
    "url": "网页URL",
    "title": "网页标题",
    "content": "网页正文内容",
    "content_length": "内容长度",
    "tts_content": ["TTS分段结果数组"],
    "tts_statistics": {
      "total_segments": "总分段数",
      "average_length": "平均段落长度",
      "max_length": "最大段落长度",
      "min_length": "最小段落长度"
    },
    "extraction_time": "提取耗时（秒）",
    "timestamp": "时间戳",
    "status": "处理状态"
  }
}
```

## 测试模板

在本地测试时，可以使用以下测试模板作为event参数：

```json
{
  "url": "https://mp.weixin.qq.com/s/X86OrSAkzgI_IHqGeuPLqw",
  "options": {}
}
```

带选项的测试：

```json
{
  "url": "https://mp.weixin.qq.com/s/X86OrSAkzgI_IHqGeuPLqw",
  "options": {
    "timeout": 30,
    "max_retries": 3
  }
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