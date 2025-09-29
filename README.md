![Ten Hackathon 2025 banner](banner-hackathon.png)

# 🦌 小鹿光年 - 智能回忆录助手

**团队名称**: 小鹿光年 (DeerLight)  
**项目名称**: XiaoLu Memoir Assistant  
**TEN Hackathon 2025 参赛作品**

---

## 🎯 项目简介

小鹿光年是一个基于 TEN Framework 构建的智能回忆录助手，通过自然语言对话帮助用户记录、整理和编写个人回忆录。小鹿不仅是一个简单的记录工具，更是一个温暖的陪伴者，能够智能识别用户意图、自动整理时间线、并最终生成完整的回忆故事。

## ✨ 核心功能

### 🧠 智能意图识别
- **回忆录创作模式**: 自动识别用户分享回忆的意图
- **闲聊模式**: 区分日常对话，单独存储不影响回忆录内容
- **大纲查看模式**: 识别用户查看进度的需求

### 📖 自动章节管理
- **时间线分析**: 根据对话内容自动识别时间段（童年、青年、成年等）
- **智能分章**: 按时间线自动创建和管理章节
- **角色识别**: 自动提取对话中的人物、地点、情感等关键信息

### ✍️ 智能成书功能
- **片段收集**: 收集用户的对话片段，每个章节达到5个片段时自动触发成书
- **格式转换**: 将第一人称对话转换为第三人称故事叙述
- **时序整理**: 按时间顺序整理故事内容

### 🤗 温暖的交互体验
- **倾听者人格**: 小鹿以温暖陪伴的方式与用户互动，不会过度引导
- **情感回应**: 对用户的回忆给予真诚的理解和回应
- **适度互动**: 在合适的时候给予鼓励，让用户感到被倾听

## 🏗️ 技术架构

### 基于 TEN Framework
- **模块化设计**: 使用 TEN Framework 的扩展系统
- **异步通信**: 各模块间通过数据流异步通信
- **可扩展性**: 易于添加新功能和扩展

### 核心扩展模块
- **main_python**: 主控制模块，处理语音输入输出和会话管理
- **memoir_storage_python**: 小鹿的核心智能模块，负责意图识别、章节管理和成书功能
- **openai_llm2_python**: LLM 集成模块，提供自然语言理解和生成能力
- **message_collector2**: 消息收集模块
- **minimax_tts_websocket_python**: 文本转语音模块

## 🚀 快速开始

### 环境要求
- Python 3.8+
- TEN Runtime Environment
- 必要的 API 密钥（详见配置说明）

### 安装步骤
1. 克隆项目到本地
2. 进入 `voice-assistant` 目录
3. 配置 `property.json` 中的 API 密钥
4. 启动项目：
   ```bash
   cd voice-assistant
   ./bin/start
   ```

### 配置说明
在 `voice-assistant/property.json` 中配置以下 API 密钥：
- `OPENAI_API_KEY`: OpenAI API 密钥（用于 LLM）
- `MINIMAX_TTS_API_KEY`: Minimax TTS API 密钥（用于语音合成）
- 其他相关 API 密钥

## 🎨 使用场景

### 典型对话流程
1. **开始对话**: 用户："我想记录一些童年的回忆"
2. **智能响应**: 小鹿："好的，我很乐意帮你记录童年回忆！"
3. **深入交流**: 用户分享具体回忆，小鹿给予温暖回应
4. **自动整理**: 小鹿在后台自动分析、分类和存储
5. **智能成书**: 收集足够片段后自动生成完整故事

### 支持的回忆类型
- 童年时光
- 学生时代
- 工作经历
- 家庭生活
- 重要事件

## 🔧 项目特色

### 1. 温暖的人工智能
不同于冰冷的工具，小鹿具有温暖的人格，能够：
- 真诚倾听用户的每个故事
- 给予适当的情感回应
- 在合适的时候提供鼓励
- 让用户感到被理解和支持

### 2. 智能的内容管理
- 自动识别时间线和章节
- 智能提取关键信息（人物、地点、情感）
- 自动触发成书条件
- 保持故事的连贯性和完整性

### 3. 灵活的交互模式
- 支持语音和文本输入
- 区分不同类型的对话内容
- 提供进度查看和回顾功能
- 支持随时暂停和继续

## 📊 项目结构

```
xiaolu-memoir-assistant-deerlight/
├── voice-assistant/                    # 主项目目录
│   ├── property.json                   # 主配置文件
│   ├── manifest.json                   # 项目清单
│   └── ten_packages/
│       ├── extension/
│       │   ├── main_python/            # 主控制扩展
│       │   ├── memoir_storage_python/  # 小鹿智能核心
│       │   ├── openai_llm2_python/     # LLM 集成
│       │   ├── message_collector2/     # 消息收集
│       │   └── minimax_tts_websocket_python/ # TTS
│       └── system/                     # 系统依赖
└── README.md                          # 项目说明
```

## 🎯 未来规划

- 支持更多语言模型
- 添加图片和多媒体回忆支持
- 提供更丰富的输出格式（PDF、网页等）
- 支持协作式回忆录创作
- 添加隐私保护和数据加密

## 🤝 贡献

欢迎为小鹿光年项目做出贡献！请通过 Pull Request 的方式提交您的改进。

## 📞 联系我们

*让每一份回忆都有温度，让每一个故事都值得铭记。* 🦌✨

---

## TEN Hackathon 2025 参赛信息

**团队**: 小鹿光年 (DeerLight)  
**项目**: XiaoLu Memoir Assistant  
**Hackathon**: TEN Hackathon 2025

### 参赛说明
1. fork this repository https://github.com/TEN-framework/ten-hackathon-2025
2. create a folder with following name "<team name> - <project name>" at root folder
3. push the code to your forked repository, create a pull request

More details:


https://docs.google.com/forms/d/e/1FAIpQLSeApnJUb4bir-NKNDDuGcvcMT45StDteL3mTFQkFDMcntTQdw/viewform

