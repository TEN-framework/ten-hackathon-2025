"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";

export interface FloatingVoiceButtonProps {
  connected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function FloatingVoiceButton(props: FloatingVoiceButtonProps) {
  const { connected = false, onClick, className } = props;

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[#3D53F5] text-white shadow-lg",
        "transition-all duration-200 hover:scale-110 hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-[#3D53F5] focus:ring-offset-2",
        "active:scale-95",
        className
      )}
      aria-label="打开语音对话"
    >
      <Mic className="h-6 w-6" />
      
      {/* 连接状态指示点 */}
      {connected && (
        <span className="absolute right-1 top-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
        </span>
      )}
    </button>
  );
}
