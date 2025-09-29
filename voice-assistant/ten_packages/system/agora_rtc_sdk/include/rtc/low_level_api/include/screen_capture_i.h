//
//  Agora Media SDK
//
//  Created by Sting Feng in 2015-05.
//  Copyright (c) 2015 Agora IO. All rights reserved.
//
#pragma once

#include "AgoraRefPtr.h"
#include "NGIAgoraExtensionScreenSource.h"
#include "NGIAgoraScreenCapturer.h"
#include "api/video/video_content_type.h"
#include "api/video/video_frame.h"
#include "api/video/video_sink_interface.h"
#include "modules/desktop_capture/desktop_capturer.h"

namespace agora {
namespace rtc {

class IScreenCaptureObserver;

class IScreenCapturerEx : public IScreenCapturer {
public:
  enum SCREEN_CAPTURER_STATE {
      SCREEN_CAPTURER_STARTED,
      SCREEN_CAPTURER_STOPPED,
  };
 public:
  virtual ~IScreenCapturerEx() {}
  virtual int StartCapture() = 0;
  virtual int StopCapture() = 0;
  virtual void RegisterCaptureDataCallback(
      std::weak_ptr<::rtc::VideoSinkInterface<webrtc::VideoFrame>> dataCallback) = 0;
  virtual int CaptureMouseCursor(bool capture) = 0;
  virtual int GetScreenDimensions(VideoDimensions& dimension) = 0;
  virtual int SetOutputDimensions(VideoDimensions dimension) {return 0;};
  virtual int SetContentType(agora::VideoContentSubType type) {return 0;};
  virtual void GetContentType(agora::VideoContentType& type, agora::VideoContentSubType& subtype) {};
  virtual bool FocusOnSelectedSource() = 0;
  virtual void SetHighLight(bool isHighLight, unsigned int color, int width) {}
  virtual void SetVideoQoEPusher(std::weak_ptr<agora::rtc::VideoStatsEventsPusher> pusher) = 0;

#if defined(_WIN32) || (defined(__APPLE__) && !TARGET_OS_IPHONE && TARGET_OS_MAC)
  virtual int initWithDisplayIdLLApiInternal(uint32_t displayId, const rtc::Rectangle& regionRect) = 0;
#endif

#if defined(_WIN32) || (defined(__linux__) && !defined(__ANDROID__))
  virtual int initWithScreenRectLLApiInternal(const rtc::Rectangle& screenRect, const rtc::Rectangle& regionRect) = 0;
#endif
  virtual int initWithWindowIdLLApiInternal(view_t windowId, const rtc::Rectangle& regionRect) = 0;
  virtual int updateScreenCaptureRegionLLApiInternal(const rtc::Rectangle& rect) = 0;
  virtual int setScreenOrientationLLApiInternal(VIDEO_ORIENTATION orientation) = 0;
  virtual int setFrameRateLLApiInternal(int rate) = 0;
#if defined(__ANDROID__)
  virtual int initWithMediaProjectionPermissionResultDataLLApiInternal(void* data, const VideoDimensions& dimensions) = 0;
#endif
#if defined(_WIN32)
  virtual int InitUsingLastRegionSetting() { return -ERR_NOT_SUPPORTED; }
  virtual void SetCaptureSource(bool allow_magnification_api, bool allow_directx_capturer) {}
  virtual void GetCaptureSource(bool& allow_magnification_api, bool& allow_directx_capturer) {}
  virtual void SetAllowUseWGC(bool allow_use_wgc) {}
  virtual void GetAllowUseWGC(bool& allow_use_wgc) {}
  virtual void SetCaptureToTexture(bool capture_to_texture) {}
  virtual void GetCaptureToTexture(bool& capture_to_texture) {}
#endif // _WIN32

#if defined(_WIN32) || (defined(WEBRTC_MAC) && !defined(WEBRTC_IOS))
  virtual void ForcedUsingScreenCapture(bool using_screen_capture) {}

  virtual void SetExcludeWindowList(const std::vector<void *>& window_list) = 0;
  virtual webrtc::DesktopCapturer::SourceId GetSourceId() = 0;
  virtual int GetCaptureType() = 0;
#endif // _WIN32 || (WEBRTC_MAC&&!WEBRTC_IOS)
  virtual int registerScreenCaptureObserver(IScreenCaptureObserver* observer) {
      return -ERR_NOT_SUPPORTED;
  }
  virtual int unregisterScreenCaptureObserver(IScreenCaptureObserver* observer) {
      return -ERR_NOT_SUPPORTED;
  }
  virtual void* getScreenCaptureSources(const IScreenCaptureSource::ScreenSourceListOption& option) {
      return nullptr;
  }
  virtual void deinit() {};
  virtual void attachStatsSpace(uint64_t stats_space) {}
};

class IScreenCaptureObserver {
public:
  virtual void onScreenCaptureStateChanged(IScreenCapturerEx::SCREEN_CAPTURER_STATE state) {
    (void) state;
  }
protected:
  virtual ~IScreenCaptureObserver() {}
};

#if defined(__ANDROID__) || (defined(TARGET_OS_IPHONE) && TARGET_OS_IPHONE)
class AudioPcmDataSinkInterface;
class IScreenCapturerEx2 : public IScreenCapturer2 {
 public:
  virtual int startVideoCapture() = 0;
  virtual int stopVideoCapture() = 0;
  virtual int startAudioCapture() = 0;
  virtual int stopAudioCapture() = 0;
  virtual void addPcmDataSink(AudioPcmDataSinkInterface* sink) = 0;
  virtual void removePcmDataSink(AudioPcmDataSinkInterface* sink) = 0;
  virtual void deinit() {};
  virtual void attachStatsSpace(uint64_t stats_space) {}
  virtual void SetVideoQoEPusher(std::weak_ptr<agora::rtc::VideoStatsEventsPusher> pusher) = 0;
  virtual int setScreenCaptureDimensionsLLApiInternal(const VideoDimensions& dimensions) = 0;
  virtual int updateScreenCaptureRegionLLApiInternal(const rtc::Rectangle& regionRect) = 0;
  virtual int setFrameRateLLApiInternal(int fps) = 0;
  virtual int setAudioRecordConfigLLApiInternal(int channels, int sampleRate) = 0;
  virtual int setAudioVolumeLLApiInternal(uint32_t volume) = 0;
};
#endif

} // namespace rtc
} // namespace agora
