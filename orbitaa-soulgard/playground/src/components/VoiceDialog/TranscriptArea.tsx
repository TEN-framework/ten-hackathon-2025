"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TranscriptAreaProps {
  userText?: string;
  bitaaText?: string;
  className?: string;
}

export default function TranscriptArea(props: TranscriptAreaProps) {
  const { userText, bitaaText, className } = props;

  // 如果都没有文本，不显示
  if (!userText && !bitaaText) {
    return null;
  }

  return (
    <div className={cn("space-y-3 rounded-lg bg-black/30 p-4", className)}>
      {/* 用户说的话 */}
      {userText && (
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 rounded-full bg-blue-500/20 px-3 py-1">
            <span className="text-sm font-medium text-blue-400">你</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-white/90">{userText}</p>
          </div>
        </div>
      )}

      {/* Bitaa 说的话 */}
      {bitaaText && (
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 rounded-full bg-green-500/20 px-3 py-1">
            <span className="text-sm font-medium text-green-400">Bitaa</span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-white/90">{bitaaText}</p>
            {/* 打字动画 */}
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-green-400"></span>
          </div>
        </div>
      )}
    </div>
  );
}
