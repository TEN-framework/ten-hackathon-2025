"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ImageShowProps {
  className?: string;
}

export default function ImageShow({ className }: ImageShowProps) {
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("h-full overflow-hidden min-h-0 flex flex-col border-2 border-red-500", className)}>
      <div className="flex w-full flex-col p-4 flex-1">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            📚 题目上传区
          </h3>
          <p className="text-sm text-gray-400">上传题目图片，AI将帮您分析和解答</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/50 min-h-[200px] md:min-h-[300px]">
          {imagePreview ? (
            <div className="relative w-full h-full flex flex-col items-center justify-center p-2 md:p-4">
              <div className="relative max-w-full max-h-[75%] md:max-h-[80%] flex items-center justify-center">
                <img 
                  src={imagePreview} 
                  alt="Selected" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 md:top-2 md:right-2 h-6 w-6 rounded-full p-0 bg-red-600 hover:bg-red-700 text-white text-xs"
                >
                  ×
                </button>
              </div>
              
              {selectedImage && (
                <div className="mt-2 md:mt-4 text-center px-2">
                  <p className="text-xs md:text-sm text-gray-300 mb-1 truncate max-w-full">
                    {selectedImage.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedImage.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 p-4">
              <div className="text-4xl mb-4">👁️</div>
              <p className="text-sm md:text-lg font-medium mb-1 md:mb-2">暂无图片</p>
              <p className="text-xs md:text-sm text-center">点击下方按钮上传图片</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={handleUploadClick}
            className="flex-1 bg-transparent border border-gray-600 text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center justify-center"
          >
            <span className="mr-2">📁</span>
            {selectedImage ? '更换题目' : '上传题目'}
          </button>
        </div>
      </div>
    </div>
  );
}