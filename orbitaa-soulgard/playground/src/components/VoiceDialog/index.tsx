"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, Phone } from "lucide-react";
import { IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { rtcManager, IUserTracks, IRtcUser } from "@/manager";
import { useAppSelector } from "@/common";
import AgentView from "@/components/Agent/View";
import MicrophoneBlock from "@/components/Agent/Microphone";
import TranscriptArea from "./TranscriptArea";
import { toast } from "sonner";

export interface VoiceDialogProps {
  open?: boolean;
  onClose?: () => void;
}

let hasInit: boolean = false;

export default function VoiceDialog(props: VoiceDialogProps) {
  const { open = false, onClose } = props;

  const agentConnected = useAppSelector((state) => state.global.agentConnected);
  const options = useAppSelector((state) => state.global.options);
  const { channel, userId } = options;
  const [audioTrack, setAudioTrack] = React.useState<IMicrophoneAudioTrack>();
  const [remoteUser, setRemoteUser] = React.useState<IRtcUser>();
  
  // 实时转写状态
  const [currentUserText, setCurrentUserText] = React.useState("");
  const [currentBitaaText, setCurrentBitaaText] = React.useState("");
  
  // 通话时长
  const [callDuration, setCallDuration] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (open && agentConnected) {
      initVoiceDialog();
      startTimer();
    }

    return () => {
      if (hasInit) {
        cleanup();
      }
      stopTimer();
    };
  }, [open, agentConnected]);

  const initVoiceDialog = async () => {
    if (hasInit) return;

    console.log("[VoiceDialog] init");
    rtcManager.on("localTracksChanged", onLocalTracksChanged);
    rtcManager.on("remoteUserChanged", onRemoteUserChanged);
    rtcManager.on("userTranscript", onUserTranscript);
    rtcManager.on("bitaaTranscript", onBitaaTranscript);

    try {
      // 创建麦克风 track
      if (!rtcManager.localTracks.audioTrack) {
        console.log("[VoiceDialog] creating microphone track");
        await rtcManager.createMicrophoneAudioTrack();
      }

      // Join RTC 频道
      if (rtcManager.client.connectionState !== "CONNECTED") {
        console.log("[VoiceDialog] joining RTC channel:", channel, userId);
        await rtcManager.join({ channel, userId });
      }

      // 发布音频流
      if (rtcManager.localTracks.audioTrack) {
        console.log("[VoiceDialog] publishing audio track");
        await rtcManager.publish();
        setAudioTrack(rtcManager.localTracks.audioTrack);
      }

      console.log("[VoiceDialog] RTC initialized successfully");
    } catch (error) {
      console.error("[VoiceDialog] Failed to initialize RTC:", error);
      toast.error("Failed to initialize voice call");
    }

    hasInit = true;
  };

  const cleanup = () => {
    console.log("[VoiceDialog] cleanup");
    rtcManager.off("localTracksChanged", onLocalTracksChanged);
    rtcManager.off("remoteUserChanged", onRemoteUserChanged);
    rtcManager.off("userTranscript", onUserTranscript);
    rtcManager.off("bitaaTranscript", onBitaaTranscript);
    hasInit = false;
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCallDuration(0);
  };

  const onLocalTracksChanged = (tracks: IUserTracks) => {
    console.log("[VoiceDialog] onLocalTracksChanged", tracks);
    const { audioTrack } = tracks;
    if (audioTrack) {
      setAudioTrack(audioTrack);
    }
  };

  const onRemoteUserChanged = (user: IRtcUser) => {
    console.log("[VoiceDialog] onRemoteUserChanged", user);
    if (user.audioTrack) {
      setRemoteUser(user);
    }
  };

  const onUserTranscript = ({ text, isFinal }: { text: string; isFinal: boolean }) => {
    console.log("[VoiceDialog] userTranscript", text, isFinal);
    if (isFinal) {
      // 最终结果：清空当前文本
      setCurrentUserText("");
    } else {
      // 中间结果：实时更新
      setCurrentUserText(text);
    }
  };

  const onBitaaTranscript = ({ text, isFinal }: { text: string; isFinal: boolean }) => {
    console.log("[VoiceDialog] bitaaTranscript", text, isFinal);
    if (isFinal) {
      // 检测是否说"拜拜"等结束语
      if (/拜拜|再见|结束|停止|谢谢你|很高兴和你聊天|聊天到这里|今天先聊到这/.test(text)) {
        console.log("🔔 检测到 Bitaa 说拜拜，准备自动挂断");
        handleAutoHangup();
      }
      setCurrentBitaaText("");
    } else {
      // 中间结果：实时更新
      setCurrentBitaaText(text);
    }
  };

  const handleAutoHangup = () => {
    toast.info("Bitaa 已结束通话");
    // 延迟 2 秒后自动挂断
    setTimeout(() => {
      handleHangup();
    }, 2000);
  };

  const handleHangup = () => {
    setCurrentUserText("");
    setCurrentBitaaText("");
    stopTimer();
    onClose?.();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!open) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 对话框内容 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full max-w-2xl rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f1419]",
            "flex max-h-[90vh] flex-col overflow-hidden shadow-2xl border border-white/10"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部状态栏 */}
          <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-6 py-4">
            <div className="flex items-center space-x-3">
              {/* 连接状态指示 */}
              <div className="flex items-center space-x-2">
                {agentConnected ? (
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium text-green-400">通话中</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-gray-500"></span>
                    <span className="text-sm font-medium text-gray-400">未连接</span>
                  </div>
                )}
              </div>
              
              {/* 通话时长 */}
              {agentConnected && (
                <div className="text-sm text-white/70">
                  {formatDuration(callDuration)}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* 挂断按钮 */}
              <button
                onClick={handleHangup}
                className="rounded-full bg-red-500 p-2 text-white transition-all hover:bg-red-600 active:scale-95"
                aria-label="挂断"
              >
                <Phone className="h-4 w-4" />
              </button>
              
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex flex-1 flex-col overflow-y-auto p-6">
            {/* Bitaa 标识 */}
            <div className="mb-4 text-center">
              <h2 className="text-2xl font-bold text-white">与 Bitaa 实时对话</h2>
              <p className="mt-1 text-sm text-white/60">AI 助手正在聆听...</p>
            </div>

            {/* Agent 音频可视化 */}
            <div className="mb-6">
              <AgentView audioTrack={remoteUser?.audioTrack} />
            </div>

            {/* 实时转写显示区域 */}
            <TranscriptArea
              userText={currentUserText}
              bitaaText={currentBitaaText}
              className="mb-6"
            />

            {/* 麦克风控制 */}
            <div className="mt-auto">
              <MicrophoneBlock audioTrack={audioTrack} />
            </div>
          </div>

          {/* 提示信息 */}
          {!agentConnected && (
            <div className="border-t border-white/10 bg-yellow-900/30 px-6 py-3 text-center">
              <p className="text-sm text-yellow-400">
                ⚠️ 请先点击"连接"按钮建立与 Bitaa 的连接
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}