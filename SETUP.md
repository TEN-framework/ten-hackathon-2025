# 🚀 小鹿光年 - 快速设置指南

## 📋 环境配置

### 1. 配置 API 密钥

在 `voice-assistant/property.json` 中配置以下 API 密钥：

```json
{
  // LLM 配置 (必需)
  "llm": {
    "api_key": "your_openai_or_doubao_api_key",
    "base_url": "https://your-llm-endpoint/",
    "model": "your-model-name"
  },
  
  // TTS 配置 (必需)
  "tts": {
    "params": {
      "api_key": "your_minimax_tts_api_key"
    }
  },
  
  // 天气工具 (可选)
  "weatherapi_tool_python": {
    "api_key": "your_weatherapi_key"
  }
}
```

### 2. 当前使用的服务

项目默认配置使用：
- **LLM**: 豆包 (Doubao) - `doubao-1.5-lite-32k-250115`
- **TTS**: Minimax TTS WebSocket
- **ASR**: (根据需要配置)

### 3. 必需的 API 密钥

| 服务 | 用途 | 必需性 | 获取地址 |
|------|------|--------|----------|
| 豆包/OpenAI | 自然语言理解和生成 | ✅ 必需 | [豆包开放平台](https://console.volcengine.com/ark) |
| Minimax TTS | 语音合成 | ✅ 必需 | [Minimax 开放平台](https://www.minimax.chat/) |
| WeatherAPI | 天气查询工具 | ❌ 可选 | [WeatherAPI](https://www.weatherapi.com/) |

## 🔧 安装步骤

### 前置要求
- Python 3.8+
- TEN Runtime Environment
- 必要的系统依赖

### 安装命令
```bash
# 1. 进入项目目录
cd xiaolu-memoir-assistant-deerlight/voice-assistant

# 2. 安装 Python 依赖
pip install -r ten_packages/extension/memoir_storage_python/requirements.txt

# 3. 配置 property.json 中的 API 密钥 (重要!)

# 4. 启动项目
./bin/start
```

## 🎯 快速测试

启动后，你可以尝试以下对话：

1. **回忆录创作**:
   - "我想记录一些童年的回忆"
   - "小时候我住在奶奶家..."

2. **查看进度**:
   - "看看我现在的进度"
   - "显示大纲"

3. **闲聊测试**:
   - "今天天气怎么样？"
   - "最近工作累不累？"

## 🚨 常见问题

### Q: 启动时报错找不到模块？
A: 确保安装了所有 Python 依赖，特别是 `jieba` 等中文处理库。

### Q: 语音功能不工作？
A: 检查 Minimax TTS API 密钥是否正确配置。

### Q: LLM 不响应？
A: 确认豆包或 OpenAI API 密钥有效，并检查网络连接。

### Q: 如何查看生成的回忆录？
A: 回忆录数据保存在 `memoir_data/` 目录下的 JSON 文件中。

## 📱 与小鹿对话技巧

- **自然交流**: 用自然的语言分享回忆，小鹿会智能识别意图
- **按时间分享**: 小鹿会自动根据时间线整理章节
- **耐心交流**: 每个章节需要5个对话片段才会自动成书
- **查看进度**: 随时可以询问"现在到哪里了"来查看进度

---

*如有问题，请检查 README.md 获取更详细的说明。* 🦌
