# LiveCap Application Download Instructions

## For TEN Dev Challenge 2025 Judges

Due to the large size of the LiveCap application (2.6GB), we have prepared the application as a compressed RAR archive split into manageable parts.

## 📥 Download Process

### Step 1: Obtain Download Link
Please contact the competition organizers or check the submission form for the download link to the application archive.

### Step 2: Download All Parts
The application is split into 26 RAR archive parts:
- `app_data.part01.rar` through `app_data.part25.rar` (100MB each)
- `app_data.part26.rar` (89MB)
- **Total size**: ~2.6GB

⚠️ **Important**: You must download ALL parts to extract the application successfully.

### Step 3: Extract the Archive

#### Using WinRAR (Recommended):
1. Place all `.rar` files in the same directory
2. Right-click on `app_data.part01.rar`
3. Select "Extract Here" or "Extract to app_data\"
4. The extraction will automatically process all parts

#### Using 7-Zip:
1. Place all `.rar` files in the same directory
2. Right-click on `app_data.part01.rar`
3. Select "7-Zip" → "Extract Here"
4. The extraction will automatically process all parts

### Step 4: Verify Extraction
After extraction, you should have an `app_data` folder containing:
- `app.exe` - Main application executable
- `config.yaml.template` - Configuration template
- Various `.dll` and `.pyd` files - Required libraries
- Other support files and directories

## 🚀 Running the Application

1. **Navigate to the extracted folder**:
   ```
   cd app_data
   ```

2. **Run the application**:
   - Double-click `app.exe`, or
   - Run from command line: `.\app.exe`

3. **Initial Setup**:
   - On first launch, the application will download required AI models
   - This requires an internet connection and may take 10-30 minutes
   - Approximately 5GB of additional space is needed for models

## ⚙️ Configuration

### Default Settings
The application comes with a pre-configured `config.yaml.template` file with optimal settings for demonstration.

### Customization
To customize settings:
1. Copy `config.yaml.template` to `config.yaml`
2. Edit the configuration file with your preferences
3. Restart the application

## 🎯 Quick Test

To quickly test the application:

1. **Start the application** (`app.exe`)
2. **Select your microphone** from the dropdown
3. **Choose an ASR engine**:
   - `parakeet_ja` for Japanese
   - `parakeet` for English
   - `whispers2t_base` for multilingual
4. **Click "Start"** to begin transcription
5. **Speak into your microphone** - transcription appears in real-time

## 🔧 Troubleshooting

### Application won't start
- Ensure you have Windows 10/11 (64-bit)
- Install Visual C++ Redistributable if prompted
- Check that all RAR parts were extracted correctly

### Models download fails
- Ensure stable internet connection
- Check firewall settings
- Verify you have 5GB free disk space

### No audio input detected
- Check Windows audio settings
- Ensure microphone permissions are granted
- Try selecting a different audio device in the app

### CUDA errors (GPU-related)
- Application will automatically fall back to CPU mode
- For GPU acceleration, ensure NVIDIA drivers are updated
- CUDA 11.8+ is required for GPU support

## 📞 Support

For evaluation-specific issues:
- Contact TEN Dev Challenge 2025 organizers
- Include screenshots of any error messages

For technical questions about the application:
- Refer to the included documentation
- Contact Pine Lab (details in main README)

## 📝 Notes for Judges

1. **Performance Testing**: For best performance, use a system with:
   - Intel i5/Ryzen 5 or better
   - 16GB RAM
   - NVIDIA GPU (optional but recommended)

2. **Feature Testing**: Key features to evaluate:
   - Real-time transcription latency
   - Multi-language support
   - OBS integration (WebSocket on port 1337)
   - VRChat OSC support
   - Translation capabilities

3. **TEN VAD Testing**: To specifically test TEN VAD integration:
   - Monitor the VAD state indicator in the UI
   - Test in noisy environments
   - Observe speech detection accuracy
   - Check frame-level processing (16ms resolution)

---

Thank you for evaluating LiveCap for TEN Dev Challenge 2025!

*Pine Lab*