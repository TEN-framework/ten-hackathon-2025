# 🌙 SleepWell - AI Memoir Assistant

**Team:** SleepWell  
**Hackathon:** TEN Hackathon 2025

> An intelligent voice assistant that helps you capture daily memories, analyze emotions, and organize your life through natural conversations.

---

## 🎯 Project Overview

SleepWell is an AI-powered voice assistant built on the TEN Framework that provides real-time conversational interactions with advanced emotion analysis and memory capabilities. It acts as your personal memoir companion, automatically extracting insights, todos, and emotional states from your daily conversations.

---

## ✨ Key Features

### 🎙️ **Real-time Voice Interaction**
- Seamless voice-to-voice conversation via Agora RTC
- Low-latency audio streaming with intelligent turn detection
- Natural conversation flow with interrupt handling

### 🧠 **Intelligent AI Processing**
- **LLM**: DeepSeek Chat for contextual understanding
- **ASR**: Deepgram for accurate speech recognition
- **TTS**: ElevenLabs for natural voice synthesis
- Context-aware dialogue management

### 😊 **Emotion Analysis**
- Real-time mood detection during conversations
- Emotional trend tracking over time
- Sentiment scoring with confidence levels

### ✅ **Smart Todo Extraction**
- Automatic task identification from conversations
- Priority level assignment (high/medium/low)
- Category-based organization
- Contextual deadline detection

### 📔 **Daily Memoir Generation**
- Automatic conversation summarization
- Key insights extraction
- Emotional context preservation
- Searchable memory archives

---

## �� Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- API Keys:
  - Agora App ID & Certificate
  - Deepgram API Key
  - DeepSeek API Key
  - ElevenLabs API Key

### Installation & Running

1. **Start the development environment**
```bash
   docker-compose up -d ten_agent_dev
docker-compose exec ten_agent_dev /bin/bash
task use
task run
http://localhost:3000
**Made with ❤️ by Team SleepWell for TEN Hackathon 2025**
