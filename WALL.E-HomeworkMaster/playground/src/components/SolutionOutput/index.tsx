"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/common";
import { setSolutionText } from "@/store/reducers/global";

interface SolutionOutputProps {
  className?: string;
  theme?: 'light' | 'night';
}

export default function SolutionOutput({ className, theme = 'night' }: SolutionOutputProps) {
  const [copied, setCopied] = React.useState<boolean>(false);
  const solution = useAppSelector((state) => state.global.solutionText);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    setCopied(false);
  }, [solution]);

  // 主题样式配置
  const themeStyles = {
    light: {
      container: 'bg-gradient-to-br from-white to-green-50/30 border border-green-200/50 shadow-lg',
      title: 'text-gray-800 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent',
      textarea: 'bg-gradient-to-br from-green-50/50 to-blue-50/30 border-green-200 text-gray-800',
      button: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all',
      buttonSecondary: 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 shadow-md hover:shadow-lg transform hover:scale-105 transition-all',
      buttonDanger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all'
    },
    night: {
      container: 'bg-gray-900',
      title: 'text-white',
      textarea: 'bg-gray-800 border-gray-600 text-white',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      buttonSecondary: 'bg-gray-700 hover:bg-gray-600 text-white',
      buttonDanger: 'bg-red-600 hover:bg-red-700 text-white'
    }
  };

  const currentTheme = themeStyles[theme];

  const handleCopy = async () => {
    if (solution) {
      try {
        await navigator.clipboard.writeText(solution);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  };

  const handleDownload = () => {
    if (solution) {
      const blob = new Blob([solution], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `解题答案_${new Date().toLocaleDateString()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClear = () => {
    dispatch(setSolutionText(""));
    setCopied(false);
  };

  return (
    <div className={cn("h-full overflow-hidden min-h-0 flex flex-col", className, currentTheme.container)}>
      <div className="flex w-full flex-col p-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-semibold flex items-center ${currentTheme.title}`}>
              <span className="mr-2">✅</span>
              解题答案
            </h3>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>AI解题结果输出区</p>
          </div>
          
          {solution && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`px-2 py-1 text-xs border rounded transition-all ${theme === 'light' ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:shadow-md' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}`}
              >
                📋 {copied ? '已复制' : '复制'}
              </button>
              
              <button
                onClick={handleDownload}
                className={`px-2 py-1 text-xs border rounded transition-all ${theme === 'light' ? 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:shadow-md' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}`}
              >
                💾 下载
              </button>
              
              <button
                onClick={handleClear}
                className={`px-2 py-1 text-xs border rounded transition-all ${theme === 'light' ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 hover:shadow-md' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}`}
              >
                🔄 清空
              </button>
            </div>
          )}
        </div>

        <div className={`flex-1 border rounded-lg p-4 overflow-y-auto ${theme === 'light' ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-blue-50/30 shadow-inner' : 'border-gray-600 bg-gray-900/50'}`}>
          {solution ? (
            <div className={`whitespace-pre-wrap leading-relaxed ${theme === 'light' ? 'text-gray-800' : 'text-gray-100'}`}>
              {solution}
            </div>
          ) : (
            <div className={`h-full flex flex-col items-center justify-center ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
              <div className="text-center space-y-4">
                <div className="text-4xl mb-4">📝</div>
                <h4 className="text-lg font-medium">等待解题答案</h4>
                <div className="space-y-2 text-sm">
                  <p>1. 在右上角上传题目图片</p>
                  <p>2. 与AI对话分析题目</p>
                  <p>3. 解题答案将在此显示</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!solution && (
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-200 text-sm">
              💡 <strong>使用提示:</strong> 上传题目图片后，在左侧聊天框中询问"请帮我解这道题"，AI会分析图片并给出详细解答。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
