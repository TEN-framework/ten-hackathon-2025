//
//  Agora Media SDK
//
//  Created by Sting Feng in 2015-05.
//  Copyright (c) 2015 Agora IO. All rights reserved.
//
#pragma once

#include "AgoraRefPtr.h"
#include "IAgoraRtcEngine.h"

#include "NGIAgoraMediaNodeFactory.h"
// #include "engine_adapter/audio/audio_node_interface.h"

#include "video_node_i.h"
#include "screen_capture_i.h"

namespace agora {
namespace rtc {

class IMediaNodeFactoryEx : public IMediaNodeFactory {
 public:
  virtual ~IMediaNodeFactoryEx() {}

  /** This method creates built-in video frame adapter
   */
  virtual agora_refptr<IVideoFrameAdapter> createVideoFrameAdapter() = 0;

  /**
   * Creates a observable video sink
   *
   * This method creates an IVideoSinkBase object, which can be used to observe video
   *
   * @param observer The pointer to the observer, must not be NULL
   * @param trackInfo The info of the track that needs observer
   * @return
   * - The pointer to IVideoSinkBase, if the method call succeeds.
   * - The empty pointer NULL, if the method call fails.
   */
  virtual agora_refptr<rtc::IObservableVideoSink> createObservableVideoSink(
      media::IVideoFrameObserver* observer, VideoTrackInfo trackInfo) = 0;

  /**
   * Creates a observable video filter
   *
   * This method creates an IVideoSinkBase object, which can be used to observe video
   *
   * @param observer The pointer to the observer, could be NULL and set by the
   * |setVideoFrameObserver| method later on.
   * @param trackInfo The info of the track that needs observer
   * @return
   * - The pointer to IVideoFilterBase, if the method call succeeds.
   * - The empty pointer NULL, if the method call fails.
   */
  virtual agora_refptr<rtc::IObservableVideoFilter> createObservableVideoFilter(
      media::IVideoFrameObserver* observer, VideoTrackInfo trackInfo) = 0;
  virtual agora_refptr<ICameraCapturerEx> createCameraCapturerLLApiInternal() = 0;
#if !(defined(__ANDROID__) || (defined(TARGET_OS_IPHONE) && TARGET_OS_IPHONE))
  virtual agora_refptr<IScreenCapturerEx> createScreenCapturerLLApiInternal() = 0;
#endif
  virtual agora_refptr<IVideoMixerSourceEx> createVideoMixerLLApiInternal() = 0;
  virtual agora_refptr<IAudioMixerSource> createAudioMixerLLApiInternal() = 0;
  virtual agora_refptr<IVideoFrameTransceiverEx> createVideoFrameTransceiverLLApiInternal() = 0;
  virtual agora_refptr<IVideoFrameSenderEx> createVideoFrameSenderLLApiInternal() = 0;
  virtual agora::agora_refptr<agora::rtc::IVideoEncodedImageSenderEx>
  createVideoEncodedImageSenderLLApiInternal() = 0;
  virtual agora_refptr<IVideoRenderer> createVideoRendererLLApiInternal() = 0;
  virtual agora_refptr<IAudioFilter> createAudioFilterLLApiInternal(const char* provider_name,
                                                                    const char* extension_name) = 0;
  virtual agora_refptr<IVideoFilter> createVideoFilterLLApiInternal(const char* provider_name,
                                                                    const char* extension_name) = 0;
  virtual agora_refptr<IVideoSinkBase> createVideoSinkLLApiInternal(const char* provider_name,
                                                                    const char* extension_name) = 0;
  virtual agora_refptr<IAudioPcmDataSender> createAudioPcmDataSenderLLApiInternal() = 0;
  virtual agora_refptr<IAudioEncodedFrameSender> createAudioEncodedFrameSenderLLApiInternal() = 0;
  virtual agora_refptr<rtc::IMediaPlayerSource> createMediaPlayerSourceLLApiInternal(
      media::base::MEDIA_PLAYER_SOURCE_TYPE type) = 0;
  virtual agora_refptr<rtc::IMediaStreamingSource> createMediaStreamingSourceLLApiInternal() = 0;
  virtual agora_refptr<IMediaPacketSender> createMediaPacketSenderLLApiInternal() = 0;
  virtual agora_refptr<IMediaRecorder2> createMediaRecorderLLApiInternal() = 0;
#if defined(__ANDROID__) || (defined(TARGET_OS_IPHONE) && TARGET_OS_IPHONE)
  virtual agora_refptr<IScreenCapturerEx2> createScreenCapturer2LLApiInternal(
      const char* provider_name, const char* extension_name) = 0;
#else
  virtual agora_refptr<IScreenCapturerEx> createScreenCapturerLLApiInternal(
      const char* provider_name, const char* extension_name) = 0;
#endif
};

class IMediaPacketCallback {
 public:
  virtual ~IMediaPacketCallback() {}

  virtual void OnMediaPacket(const uint8_t* packet, size_t length,
                             const media::base::PacketOptions& options) = 0;
};

class IMediaPacketSenderEx : public IMediaPacketSender {
 public:
  virtual ~IMediaPacketSenderEx() {}

  virtual void RegisterMediaPacketCallback(IMediaPacketCallback* dataCallback) = 0;
  virtual void UnregisterMediaPacketCallback() = 0;
};

class IMediaControlPacketCallback {
 public:
  virtual ~IMediaControlPacketCallback() {}

  virtual void OnPeerMediaControlPacket(user_id_t userId, const uint8_t* packet, size_t length) = 0;
  virtual void OnBroadcastMediaControlPacket(const uint8_t* packet, size_t length) = 0;
};

class IMediaControlPacketSenderEx : public IMediaControlPacketSender {
 public:
  virtual ~IMediaControlPacketSenderEx() {}

  virtual void RegisterMediaControlPacketCallback(
      IMediaControlPacketCallback* ctrlDataCallback) = 0;
  virtual void UnregisterMediaControlPacketCallback() = 0;
  virtual int sendBroadcastMediaControlPacketLLApiInternal(const uint8_t* packet,
                                                           size_t length) = 0;
};

}  // namespace rtc
}  // namespace agora
