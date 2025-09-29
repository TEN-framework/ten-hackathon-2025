"use client";

import dynamic from "next/dynamic";

import AuthInitializer from "@/components/authInitializer";
import { useAppSelector, EMobileActiveTab, useIsCompactLayout } from "@/common";
import Header from "@/components/Layout/Header";
import Action from "@/components/Layout/Action";
import { cn } from "@/lib/utils";
import Avatar from "@/components/Agent/AvatarTrulience";
import React from "react";
import { IRtcUser, IUserTracks } from "@/manager";
import { IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import ImageShow from "@/components/ImageShow";
import SolutionOutput from "@/components/SolutionOutput";
import SimpleTest from "@/components/SimpleTest";

const DynamicRTCCard = dynamic(() => import("@/components/Dynamic/RTCCard"), {
  ssr: false,
});
const DynamicChatCard = dynamic(() => import("@/components/Chat/ChatCard"), {
  ssr: false,
});

export default function Home() {
  const mobileActiveTab = useAppSelector(
    (state) => state.global.mobileActiveTab
  );
  const trulienceSettings = useAppSelector((state) => state.global.trulienceSettings);

  const isCompactLayout = useIsCompactLayout();
  const useTrulienceAvatar = trulienceSettings.enabled;
  const avatarInLargeWindow = trulienceSettings.avatarDesktopLargeWindow;
  const [remoteuser, setRemoteUser] = React.useState<IRtcUser>()
  const [theme, setTheme] = React.useState<'light' | 'night'>('night')

    // 主题样式配置
  const themeStyles = {
    light: {
      background: 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
      card: 'bg-white border border-gray-200 shadow-lg',
      button: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200',
      text: 'text-gray-800',
      title: 'text-gray-800',
      subtitle: 'text-gray-600',
      header: 'bg-white border-gray-200'
    },
    night: {
      background: 'bg-gray-900',
      card: 'bg-[#181a1d]',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      text: 'text-white',
      title: 'text-white', 
      subtitle: 'text-gray-400',
      header: 'bg-gray-800 border-gray-700'
    }
  };

  const currentTheme = themeStyles[theme]

  React.useEffect(() => {
    const { rtcManager } = require("../manager/rtc/rtc");
    rtcManager.on("remoteUserChanged", onRemoteUserChanged);
    return () => {
      rtcManager.off("remoteUserChanged", onRemoteUserChanged);
    };
  }, []);

  const onRemoteUserChanged = (user: IRtcUser) => {
    if (useTrulienceAvatar) {
      user.audioTrack?.stop();
    }
    if (user.audioTrack) {
      setRemoteUser(user)
    } 
  }

  return (
    <AuthInitializer>
      <div className={cn("relative mx-auto flex flex-1 min-h-screen flex-col md:h-screen", theme, currentTheme.background)}>
        <Header className="h-[60px]" theme={theme} />
        <Action theme={theme} />
        
        {/* 主题切换按钮 */}
        <div className="absolute top-4 right-4 z-50">
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg", currentTheme.card, "border")}>
            <span className={cn("text-sm font-medium", currentTheme.text)}>主题:</span>
            <button
              onClick={() => setTheme(theme === 'light' ? 'night' : 'light')}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md transition-all duration-200",
                theme === 'light' 
                  ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 shadow-lg" 
                  : "bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-800 hover:from-yellow-500 hover:to-orange-600 shadow-lg"
              )}
            >
              {theme === 'light' ? (
                <>
                  <span>☀️</span>
                  <span className="text-xs font-medium">Light</span>
                </>
              ) : (
                <>
                  <span>🌙</span>
                  <span className="text-xs font-medium">Night</span>
                </>
              )}
            </button>
          </div>
        </div>
        <div className="mx-2 mb-2 flex h-full max-h-[calc(100vh-108px-24px)] gap-2 flex-1">
          
          {/* 左侧区域 - 对话和视频 */}
          <div className="flex flex-col gap-2 w-[50%]">
            {/* 上部 - 对话框 */}
            <div className={cn("m-0 w-full rounded-lg h-[45%]", currentTheme.card)}>
              <DynamicChatCard
                className="m-0 w-full h-full"
              />
            </div>
            
            {/* 下部 - 视频通话 */}
            <div className={cn("m-0 w-full rounded-lg h-[55%]", currentTheme.card)}>
              <DynamicRTCCard
                className="m-0 w-full h-full"
              />
            </div>
          </div>

          {/* 右侧区域 - 题目上传和答案输出 */}
          <div className="flex flex-col gap-2 w-[50%]">
            {/* 上部 - 题目上传 */}
            <div className="h-[60%]">
              <SimpleTest theme={theme} />
            </div>
            
            {/* 下部 - 答案输出 */}
            <SolutionOutput className={cn("m-0 w-full rounded-lg h-[40%]", currentTheme.card)} theme={theme} />
          </div>

        </div>
      </div>
    </AuthInitializer>
  );
}
