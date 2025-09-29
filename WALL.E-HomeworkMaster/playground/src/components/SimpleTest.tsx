"use client";

import React, { useState, useRef } from 'react';
import { rtmManager } from '@/manager/rtm';
import { rtcManager } from '@/manager/rtc';
import { useAppSelector, useAppDispatch, VideoSourceType } from '@/common';
import { addChatItem, setSolutionText } from '@/store/reducers/global';
import { EMessageType, EMessageDataType, ERTMTextType } from '@/types';

interface ImageUploadShowProps {
  theme?: 'light' | 'night';
}

export default function ImageUploadShow({ theme = 'night' }: ImageUploadShowProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisQuestion, setAnalysisQuestion] = useState("");
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redux 状态
  const dispatch = useAppDispatch();
  const options = useAppSelector((state) => state.global.options);
  const rtmConnected = useAppSelector((state) => state.global.rtmConnected);
  const agentConnected = useAppSelector((state) => state.global.agentConnected);

  // 检查是否可以发送分析请求
  const canAnalyze = rtmConnected && agentConnected && imageUrl;

  // 主题样式配置
  const themeStyles = {
    light: {
      container: 'bg-gradient-to-br from-white to-blue-50/30 border border-blue-200/50 shadow-lg',
      title: 'text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent',
      subtitle: 'text-gray-600',
      uploadArea: 'border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50/50 to-purple-50/30',
      uploadAreaActive: 'border-blue-500 bg-gradient-to-br from-blue-100 to-purple-100',
      text: 'text-gray-700',
      textSecondary: 'text-gray-500',
      input: 'bg-white/70 border-blue-200 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
      button: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all',
      buttonSecondary: 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 shadow-md'
    },
    night: {
      container: 'bg-gray-900',
      title: 'text-white',
      subtitle: 'text-gray-400',
      uploadArea: 'border-gray-600 hover:border-gray-400',
      uploadAreaActive: 'border-blue-400 bg-blue-50/10',
      text: 'text-gray-300',
      textSecondary: 'text-gray-500',
      input: 'bg-gray-800 border-gray-600 text-white',
      button: 'bg-blue-500 hover:bg-blue-600 text-white',
      buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white'
    }
  };

  const currentTheme = themeStyles[theme];

  // 处理文件选择
  const lastPreparedSourceRef = useRef<string | null>(null);

  const prepareImageForRtc = React.useCallback(async (source: string) => {
    if (!source || lastPreparedSourceRef.current === source) {
      return;
    }
    try {
      await rtcManager.setImageSource(source);
      await rtcManager.switchVideoSource(VideoSourceType.IMAGE);
      lastPreparedSourceRef.current = source;
    } catch (error) {
      console.error('Failed to prepare image for RTC track', error);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
        void prepareImageForRtc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理文件输入
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 处理拖拽
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 处理URL输入
  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setImageUrl(urlInput.trim());
      void prepareImageForRtc(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  // 清除图片
  const clearImage = () => {
    setImageUrl("");
    lastPreparedSourceRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    rtcManager.clearImageSource();
    rtcManager.switchVideoSource(VideoSourceType.CAMERA).catch((error) => {
      console.warn('Failed to switch back to camera source', error);
    });
    dispatch(setSolutionText(""));
  };

  // AI图片分析
  const analyzeImage = async (question: string = "请分析这张图片") => {
    if (!canAnalyze) {
      alert('请确保已连接到AI服务并上传了图片');
      return;
    }

    setIsAnalyzing(true);
    try {
      // 构造明确触发视觉分析的提示词
      const visionPrompt = `你能看到我的摄像头吗？请仔细观察当前摄像头画面中显示的内容，然后回答：${question}`;
      
      // 发送文本请求，AI会自动调用视觉分析工具
      await rtmManager.sendText(visionPrompt);
      
      // 添加用户消息到聊天记录（显示原始问题）
      dispatch(addChatItem({
        userId: options.userId,
        text: `📷 ${question}`,
        type: EMessageType.USER,
        data_type: EMessageDataType.TEXT,
        isFinal: true,
        time: Date.now(),
      }));

      // 重置输入
      setAnalysisQuestion("");
      setShowQuestionInput(false);
      
    } catch (error) {
      console.error('分析失败:', error);
      alert('图片分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 在摄像头区域显示图片（让AI能看到）
  const showImageForAnalysis = () => {
    if (!imageUrl) return;
    
    // 创建全屏图片显示
    const overlay = document.createElement('div');
    overlay.id = 'image-analysis-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: pointer;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(255,255,255,0.3);
    `;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕ 关闭图片';
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      cursor: pointer;
      z-index: 10000;
    `;
    
    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    
    // 点击关闭
    const closeOverlay = () => {
      document.body.removeChild(overlay);
    };
    
    closeBtn.onclick = closeOverlay;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeOverlay();
    };
    
    document.body.appendChild(overlay);
    
    // 1秒后自动提示
    setTimeout(() => {
      if (document.getElementById('image-analysis-overlay')) {
        alert('图片已显示！现在可以向AI提问了。AI会分析当前屏幕上显示的内容。');
      }
    }, 1000);
  };

  // 处理快速分析按钮
  const handleQuickAnalysis = async (preset: string) => {
    if (!imageUrl) {
      alert('请先上传图片');
      return;
    }
    
    // 1. 先显示图片到全屏，让摄像头/屏幕共享能看到
    showImageForAnalysis();
    
    // 2. 稍等一下让图片完全显示
    setTimeout(() => {
      // 3. 发送文本分析请求（AI会分析当前看到的内容）
      analyzeImage(preset);
    }, 1500);
  };

  // 处理自定义问题分析
  const handleCustomAnalysis = () => {
    if (analysisQuestion.trim()) {
      analyzeImage(analysisQuestion);
    }
  };

  return (
    <div className={`h-full w-full rounded-lg p-4 flex flex-col ${currentTheme.container}`}>
      {/* 标题 */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${currentTheme.title}`}>📷 图片上传</h3>
        <p className={`text-sm ${currentTheme.subtitle}`}>支持拖拽上传、本地文件或网络图片</p>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 relative">
        {imageUrl ? (
          // 显示图片
          <div className="h-full relative">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="w-full h-full object-contain rounded-lg"
              onError={() => {
                setImageUrl("");
                alert("图片加载失败，请检查URL是否正确");
              }}
            />
            {/* 删除按钮 */}
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
            >
              ×
            </button>
          </div>
        ) : (
          // 上传区域
          <div
            className={`h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging 
                ? currentTheme.uploadAreaActive
                : currentTheme.uploadArea
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-6xl mb-4">📸</div>
            <p className={`text-center mb-2 ${currentTheme.text}`}>
              拖拽图片到此处，或点击上传
            </p>
            <p className={`text-sm ${currentTheme.textSecondary}`}>
              支持 JPG, PNG, GIF, WebP 格式
            </p>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="mt-4 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${currentTheme.button}`}
        >
          📁 选择文件
        </button>

        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`flex-1 px-4 py-2 rounded-lg transition-all ${theme === 'light' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' : 'bg-green-600 hover:bg-green-700 text-white'}`}
        >
          🌐 网络图片
        </button>
      </div>

      {/* URL输入框 */}
      {showUrlInput && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="输入图片URL地址..."
            className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 ${currentTheme.input}`}
            onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <button
            onClick={handleUrlSubmit}
            className={`px-4 py-2 rounded-lg transition-colors ${currentTheme.button}`}
          >
            确定
          </button>
        </div>
      )}

      {/* 图片信息 */}
      {imageUrl && (
        <div className={`mt-3 p-2 rounded text-sm ${theme === 'light' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-800 text-gray-300'}`}>
          ✅ 图片已加载，可以开始分析
        </div>
      )}

      {/* AI分析控制区域 */}
      {imageUrl && (
        <div className="mt-4 space-y-3">
          <div className={`text-sm font-medium ${currentTheme.text}`}>
            🤖 AI 图片分析
          </div>
          
          {/* 显示图片按钮 */}
          <button
            onClick={showImageForAnalysis}
            disabled={!imageUrl}
            className={`mb-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              theme === 'light' 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg disabled:from-gray-300 disabled:to-gray-400' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-600'
            } disabled:cursor-not-allowed`}
          >
            🖼️ 全屏显示图片（供AI分析）
          </button>
          
          {/* 快速分析按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAnalysis("这是什么题目？请帮我详细解答步骤")}
              disabled={!canAnalyze || isAnalyzing}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                theme === 'light' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg disabled:from-gray-300 disabled:to-gray-400' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-600'
              } disabled:cursor-not-allowed`}
            >
              {isAnalyzing ? '🔄 分析中...' : '📝 解答题目'}
            </button>
            
            <button
              onClick={() => handleQuickAnalysis("请仔细观察图片并解释其中的概念和知识点")}
              disabled={!canAnalyze || isAnalyzing}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                theme === 'light' 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg disabled:from-gray-300 disabled:to-gray-400' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600'
              } disabled:cursor-not-allowed`}
            >
              {isAnalyzing ? '🔄 分析中...' : '💡 解释概念'}
            </button>
            
            <button
              onClick={() => handleQuickAnalysis("请看一下这道题的答案是否正确，并给出详细分析")}
              disabled={!canAnalyze || isAnalyzing}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                theme === 'light' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg disabled:from-gray-300 disabled:to-gray-400' 
                  : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-600'
              } disabled:cursor-not-allowed`}
            >
              {isAnalyzing ? '🔄 分析中...' : '✅ 检查答案'}
            </button>
            
            <button
              onClick={() => setShowQuestionInput(!showQuestionInput)}
              disabled={!canAnalyze || isAnalyzing}
              className={`px-3 py-2 rounded-lg text-sm transition-all ${
                theme === 'light' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg disabled:from-gray-300 disabled:to-gray-400' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white disabled:bg-gray-600'
              } disabled:cursor-not-allowed`}
            >
              🗨️ 自定义问题
            </button>
          </div>

          {/* 自定义问题输入 */}
          {showQuestionInput && (
            <div className="flex gap-2">
              <input
                type="text"
                value={analysisQuestion}
                onChange={(e) => setAnalysisQuestion(e.target.value)}
                placeholder="输入你的问题..."
                className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 ${currentTheme.input}`}
                onKeyPress={(e) => e.key === 'Enter' && handleCustomAnalysis()}
                disabled={isAnalyzing}
              />
              <button
                onClick={handleCustomAnalysis}
                disabled={!analysisQuestion.trim() || isAnalyzing}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${currentTheme.button} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isAnalyzing ? '🔄' : '发送'}
              </button>
            </div>
          )}
          
          {/* 连接状态提示 */}
          {!canAnalyze && (
            <div className={`text-xs p-2 rounded ${theme === 'light' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-yellow-900/30 text-yellow-400'}`}>
              {!rtmConnected && '⚠️ 未连接到聊天服务'}
              {!agentConnected && '⚠️ AI代理未连接'}
              {!imageUrl && '⚠️ 请先上传图片'}
            </div>
          )}
          
          {/* 使用说明 */}
          {imageUrl && canAnalyze && (
            <div className={`text-xs p-3 rounded ${theme === 'light' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-blue-900/30 text-blue-400'}`}>
              💡 <strong>使用方法：</strong><br/>
              1️⃣ 点击"全屏显示图片"让AI看到图片<br/>
              2️⃣ 选择分析类型或输入自定义问题<br/>
              3️⃣ AI会分析屏幕上显示的图片内容
            </div>
          )}
        </div>
      )}
    </div>
  );
}
