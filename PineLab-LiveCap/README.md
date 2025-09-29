# LiveCap - Next-Generation Real-Time Multilingual Transcription System

<div align="center">

[![TEN Dev Challenge 2025](https://img.shields.io/badge/TEN%20Dev%20Challenge-2025-blue)](https://github.com/TEN-framework/ten-hackathon-2025)
[![License](https://img.shields.io/badge/License-Commercial-red)](LICENSE)
[![Developer](https://img.shields.io/badge/Developer-Pine%20Lab-green)](https://github.com/PineLab)

**Powered by TEN VAD Technology**

</div>

## ⚠️ Important Notice

**This repository contains a temporary submission for TEN Dev Challenge 2025 evaluation purposes only.**
- This is a commercial software product temporarily made available for competition judging
- The repository and its contents will be removed without notice after the evaluation period
- For commercial distribution, please contact Pine Lab directly

## 🌟 Overview

LiveCap is a revolutionary real-time multilingual transcription system that leverages **TEN VAD (Voice Activity Detection)** technology to achieve industry-leading accuracy and ultra-low latency. Supporting 12+ languages with 6 state-of-the-art ASR engines, LiveCap transforms live communication across streaming, gaming, and virtual environments.

## 📥 Application Download

**For TEN Dev Challenge 2025 judges:**

Due to the large size of the application (2.6GB), the executable files are hosted externally.

### Download Instructions:
1. **Download the application archive** (RAR format, split into 100MB parts)
   - **Note**: Please contact the competition organizers for the download link
   - Total size: ~2.6GB (26 parts × 100MB)

2. **Extract the archive**:
   - Place all `.rar` files in the same directory
   - Extract using WinRAR or 7-Zip
   - The extracted `app_data` folder will contain all necessary files

3. **Run the application**:
   - Navigate to the `app_data` folder
   - Run `app.exe`
   - The application will start with the default configuration

### Alternative Access Methods:
- **Steam Store**: Commercial version available (search "LiveCap")
- **Direct Demo**: Contact Pine Lab for a live demonstration
- **Enterprise Trial**: Available upon request

## 🎯 Key Features

### 🔍 Advanced Voice Detection with TEN VAD
- **Frame-level precision** (16ms resolution) for accurate speech boundaries
- **4-state detection system** with speculative execution support
- **Superior noise robustness** compared to traditional VAD solutions
- **<5% false positive rate** in real-world conditions

### 🚀 Multi-Engine Architecture
- **ReazonSpeech K2** - Japanese specialized, high-speed & high-accuracy (Zipformer)
- **NVIDIA Parakeet TDT 0.6B v3** - English highest accuracy, streaming support
- **NVIDIA Parakeet TDT CTC 0.6B JA** - Japanese specialized high-speed model
- **NVIDIA Canary 1B v2** - Multi-language support (English, German, French, Spanish)
- **MistralAI Voxtral Mini 3B** - 8 languages with auto-detection
- **WhisperS2T** - 13+ languages with multiple model sizes (tiny to large-v3)

### 📡 Professional Broadcasting
- **OBS Studio Integration** via WebSocket for zero-lag subtitle updates
- **VRChat OSC Support** for real-time subtitles in virtual environments
- **Double-stroke subtitles** with professional cinema-quality text rendering
- **Embedded font system** with reliable cross-browser display

### 🌐 Multilingual Support
- **12+ Languages**: Japanese, English, Chinese, Korean, German, French, Spanish, Russian, Arabic, Portuguese, Italian, Hindi, Dutch
- **Real-time Translation**: Google Translate integration (DeepL, OpenAI coming soon)
- **Auto Language Detection**: Automatic language identification and switching

## 💻 System Requirements

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 8GB minimum (16GB recommended)
- **GPU**: NVIDIA GPU with CUDA support (optional, CPU fallback available)
- **Storage**: 5GB for models
- **Network**: Internet connection for initial model download

## 🚀 Quick Start

### First Launch Note
- Required model files will be automatically downloaded (several GB)
- Internet connection is required for initial setup
- Ensure sufficient free space in the models folder

## 🔧 Configuration

### Basic Setup
```yaml
# config.yaml
transcription:
  engine: parakeet_ja      # Select ASR engine
  input_language: ja        # Input language
  device: cuda             # cuda/cpu

silence_detection:
  vad_threshold: 0.5       # TEN VAD sensitivity
  vad_min_speech_duration_ms: 250
  vad_speech_pad_ms: 400
```

### OBS Integration
1. Enable WebSocket server in LiveCap settings
2. Add Browser Source in OBS: `http://localhost:1337`
3. Subtitles appear in real-time with customizable styling

### VRChat Integration
```yaml
vrchat:
  osc_host: 127.0.0.1
  osc_port: 9000
```

## 📊 Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Latency** | <100ms | End-to-end transcription |
| **VAD Accuracy** | >95% | TEN VAD precision |
| **Language Support** | 12+ | Auto-detection available |
| **Concurrent Sources** | 3 | Multi-speaker support |
| **Frame Resolution** | 16ms | TEN VAD processing |

## 🎨 Subtitle Styling Features

### Professional Broadcasting Quality
- **Double-stroke System**: Professional dual-outline for perfect readability
  - Inner and outer stroke independently configurable
  - 0.1px precision width adjustment
- **Embedded Font System**: No font installation required
  - Isekai Gothic & Isekai Mincho fonts included
  - Custom font addition via "+" button
  - Reliable display on Chrome/OBS (bypasses browser limitations)
- **Real-time Preview**: WYSIWYG subtitle editing with instant visual feedback

## 🛠️ Technology Stack

### Core Technologies
- **TEN VAD Library**: Enterprise-grade voice activity detection
- **TEN Framework**: Real-time audio processing pipeline
- **PyTorch**: Neural network inference
- **PySide6**: Modern GUI framework with dark theme support

### ASR Engines
- ReazonSpeech (K2 Zipformer)
- NVIDIA NeMo (Parakeet, Canary)
- WhisperS2T (OpenAI)
- MistralAI Voxtral

### Audio Processing
- Multi-source capture with independent processing
- Noise gate with adjustable threshold
- Real-time normalization and filtering

## 🔍 TEN VAD Integration Details

### State Machine Architecture
```
SILENCE → POTENTIAL_SPEECH → CONFIRMED_SPEECH → ENDING_SPEECH
```

### VAD Configuration
- **Frame Size**: 16ms (256 samples @ 16kHz)
- **Confidence Threshold**: 0.5 (adjustable)
- **Minimum Speech Duration**: 250ms
- **Speech Padding**: 288ms post-speech (18 frames)

## 📄 License & Distribution

**Commercial Software Notice:**
- LiveCap is proprietary commercial software
- This submission is for TEN Dev Challenge 2025 evaluation only
- Unauthorized copying, redistribution, or commercial use is strictly prohibited
- This repository will be removed after the competition evaluation
- For legal use, purchase through Steam or contact Pine Lab for licensing

## 🙏 Acknowledgments

Special thanks to:
- **TEN Framework Team** for providing cutting-edge VAD technology
- **ReazonSpeech** for Japanese ASR models
- **NVIDIA NeMo** for Parakeet and Canary models
- **OpenAI** for Whisper technology
- **MistralAI** for Voxtral models

This project uses the following open-source projects:
- [PyTorch](https://pytorch.org/)
- [PySide6](https://www.qt.io/qt-for-python)
- [WebSocket](https://websockets.readthedocs.io/)
- [python-osc](https://python-osc.readthedocs.io/)

## 📧 Contact

- **Developer**: Pine Lab
- **Commercial Distribution**: Steam Store
- **Enterprise Licensing**: Contact Pine Lab directly
- **Competition Submission**: TEN Dev Challenge 2025

## 🏆 Competition Submission

This project is submitted for **TEN Dev Challenge 2025**, showcasing the innovative use of TEN VAD technology for real-time multilingual transcription.

**Evaluation Note:**
- The application binary is provided separately due to size constraints
- Full commercial features are available in the Steam release
- Repository access is temporary and will be revoked post-evaluation

---

**TEN Dev Challenge 2025 Submission by Pine Lab**

*This submission is for evaluation purposes only and will be removed after the competition.*