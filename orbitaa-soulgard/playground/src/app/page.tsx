"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import AuthInitializer from "@/components/authInitializer";
import { useAppSelector } from "@/common";
import Header from "@/components/Layout/Header";
import Action from "@/components/Layout/Action";
import FloatingVoiceButton from "@/components/FloatingVoiceButton";

const DynamicChatCard = dynamic(() => import("@/components/Chat/ChatCard"), {
  ssr: false,
});

const DynamicVoiceDialog = dynamic(() => import("@/components/VoiceDialog"), {
  ssr: false,
});

export default function Home() {
  const agentConnected = useAppSelector((state) => state.global.agentConnected);
  const [voiceDialogOpen, setVoiceDialogOpen] = React.useState(false);

  const handleOpenVoiceDialog = () => {
    setVoiceDialogOpen(true);
  };

  const handleCloseVoiceDialog = () => {
    setVoiceDialogOpen(false);
  };

  return (
    <AuthInitializer>
      <div className="relative flex min-h-screen flex-col">
        {/* 头部 */}
        <Header className="h-[60px]" />
        
        {/* 操作栏 */}
        <Action />

        {/* 聊天区域 - 满屏显示 */}
        <div className="mx-2 mb-2 flex flex-1 flex-col">
          <DynamicChatCard className="h-full rounded-lg bg-[#181a1d]" />
        </div>

        {/* 悬浮语音按钮 */}
        <FloatingVoiceButton
          connected={agentConnected}
          onClick={handleOpenVoiceDialog}
        />

        {/* 语音对话弹窗 */}
        <DynamicVoiceDialog
          open={voiceDialogOpen}
          onClose={handleCloseVoiceDialog}
        />
      </div>
    </AuthInitializer>
  );
}