//
//  Agora Media SDK
//
//  Created by Sting Feng in 2015-05.
//  Copyright (c) 2015 Agora IO. All rights reserved.
//
#pragma once

#include <memory>
#include <string>

#include "AgoraRefPtr.h"

#include "IAgoraService.h"
#include "IAgoraLog.h"

#include "audio_options_i.h"
#include "content_inspect_i.h"
#include "sync_client_i.h"
#include "audio_track_i.h"
#include "video_track_i.h"
#include "media_node_factory_i.h"
#include "bitrate_constraints.h"
#include "media_component/IAudioDeviceManager.h"
#include "api2/NGIAgoraAudioDeviceManager.h"
#include "api2/NGIAgoraMediaNode.h"
#include "media_player_i.h"

#include <functional>
#include <string>
#include <api/aosl_ref.h>

namespace agora {
namespace commons{
  class io_engine_base;
}
namespace rtm {
struct RtmConfig;
}
namespace rtc {
class AgoraGenericBridge;
class ConfigSourceAP;
class IDiagnosticService;
class ILocalUserEx;
class PredefineIpList;
class IRtcConnection;
struct RtcConnectionConfigurationEx;
class IMediaExtensionObserver;
class XdumpHandler;
class IMediaPlayer;
class IMusicContentCenter;
}  // namespace rtc

namespace base {
class IAgoraServiceObserver;

enum MediaEngineType {
  /**
   * The WebRTC engine.
   */
  MEDIA_ENGINE_WEBRTC,
  /**
   * An empty engine.
   */
  MEDIA_ENGINE_EMPTY,
  /**
   * An unknown engine.
   */
  MEDIA_ENGINE_UNKNOWN
};

struct AgoraServiceConfigEx : public AgoraServiceConfiguration {
  MediaEngineType engineType = MEDIA_ENGINE_WEBRTC;
  const char* deviceId = nullptr;
  const char* deviceInfo = nullptr;
  const char* systemInfo = nullptr;
  const char* pluginDir = nullptr;
  rtc::BitrateConstraints bitrateConstraints;
  bool apSendRequest = true;

  AgoraServiceConfigEx() {
    bitrateConstraints.start_bitrate_bps = kDefaultStartBitrateBps;
    bitrateConstraints.max_bitrate_bps = kDefaultMaxBitrateBps;
  }

  AgoraServiceConfigEx(const AgoraServiceConfiguration& rhs)
      : AgoraServiceConfiguration(rhs) {
    bitrateConstraints.max_bitrate_bps = kDefaultMaxBitrateBps;
    bitrateConstraints.start_bitrate_bps = kDefaultStartBitrateBps;
  }

 private:
  static constexpr int kDefaultMaxBitrateBps = (24 * 10 * 1000 * 95);
  static constexpr int kDefaultStartBitrateBps = 300000;
};


// full feature definition of rtc engine interface
class IAgoraServiceEx : public IAgoraService {
 public:
  using IAgoraService::initialize;
  virtual int initialize(const rtm::RtmConfig& rtmCfg) { return 0; }
  virtual void set_lite_initialized(bool initialized) {}
  virtual int initializeLLApiInternal(const AgoraServiceConfiguration& config) = 0;
  virtual int initializeEx(const AgoraServiceConfigEx& context) = 0;
  virtual agora_refptr<rtc::IRtcConnectionEx> createRtcConnectionEx(
      const rtc::RtcConnectionConfigurationEx& cfg) = 0;

  virtual int32_t setAudioDumpPath(const char* filePath) = 0;

  virtual rtc::IRtcConnection* getOneRtcConnection(bool admBinded) const = 0;
  
  virtual void enableStringUid(bool enabled) = 0;
  virtual bool useStringUid() const = 0;
  virtual bool externalAudioSinkEnabled() const = 0;
  virtual rtc::uid_t getUidByUserAccount(const std::string& app_id, const std::string& user_account) const = 0;

  // Register string user account before join channel, this would speed up join channel time.
  virtual int registerLocalUserAccount(const char* appId, const char* userAccount) = 0;

  virtual rtc::IDiagnosticService *getDiagnosticService() const = 0;

  virtual int registerAgoraServiceObserver(IAgoraServiceObserver* observer) = 0;
  virtual int unregisterAgoraServiceObserver(IAgoraServiceObserver* observer) = 0;

  virtual agora_refptr<rtc::IFileUploaderService> createFileUploadServiceEx(
      agora_refptr<rtc::IRtcConnection> rtcConnection, const char* appId, media::CONTENT_INSPECT_CLOUD_TYPE cloudType) = 0;

  virtual int atExitLLApiInternal() = 0;
  virtual int releaseLLApiInternal() = 0;
  virtual int setLogFileLLApiInternal(const char* filePath, unsigned int fileSize) = 0;
  virtual int setLogFilterLLApiInternal(unsigned int filters) = 0;
  virtual agora_refptr<rtc::IRtcConnectionEx> getRtcConnectionInChannel(const char* name,
                                                              const user_id_t usrId) = 0;
#if defined(FEATURE_RTM_SERVICE)
  virtual rtm::IRtmService* createRtmServiceLLApiInternal() = 0;
#endif
  virtual int setAudioSessionPresetLLApiInternal(rtc::AUDIO_SCENARIO_TYPE scenario) = 0;
  virtual int setAudioSessionConfigurationLLApiInternal(const AudioSessionConfiguration& config) = 0;
  virtual int getAudioSessionConfigurationLLApiInternal(AudioSessionConfiguration* config) = 0;
  virtual agora_refptr<rtc::IRtcConnection> createRtcConnectionLLApiInternal( const rtc::RtcConnectionConfiguration& cfg) = 0;
  virtual agora_refptr<rtc::IRtmpConnection> createRtmpConnectionLLApiInternal(const rtc::RtmpConnectionConfiguration& cfg) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createLocalAudioTrackLLApiInternal() = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createLocalMixedAudioTrackLLApiInternal() = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createLocalMixedAudioTrackLLApiInternal(agora_refptr<rtc::IAudioMixerSource> audioSource, bool enable_silence_packet = false) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createCustomAudioTrackLLApiInternal(agora_refptr<rtc::IAudioPcmDataSender> audioSource) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createDirectCustomAudioTrackLLApiInternal(agora_refptr<rtc::IAudioPcmDataSender> audioSource) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createCustomAudioTrackLLApiInternal(agora_refptr<rtc::IAudioPcmDataSender> audioSource, bool enableAec) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createCustomAudioTrackLLApiInternal(agora_refptr<rtc::IRemoteAudioMixerSource> audioSource) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createCustomAudioTrackLLApiInternal(agora_refptr<rtc::IAudioEncodedFrameSender> audioSource, TMixMode mixMode) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createCustomAudioTrackLLApiInternal(agora_refptr<rtc::IMediaPacketSender> source) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createMediaPlayerAudioTrackLLApiInternal( agora_refptr<rtc::IMediaPlayerSource> playerSource) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createMediaStreamingAudioTrackLLApiInternal(agora_refptr<rtc::IMediaStreamingSource> streamingSource) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createRecordingDeviceAudioTrackLLApiInternal(agora_refptr<rtc::IRecordingDeviceSource> audioSource, bool enableAec, bool overlap) = 0;
  virtual agora_refptr<rtc::INGAudioDeviceManager> createAudioDeviceManagerLLApiInternal() = 0;
  virtual agora_refptr<rtc::IMediaNodeFactoryEx> createMediaNodeFactoryLLApiInternal() = 0;
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createCameraVideoTrackLLApiInternal(agora_refptr<rtc::ICameraCapturer> videoSource, const char* track_id) = 0;

  virtual agora_refptr<rtc::ILocalVideoTrackEx> createMixedVideoTrackLLApiInternal(agora_refptr<rtc::IVideoMixerSource> videoSource, const char* id) = 0;
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createTranscodedVideoTrackLLApiInternal(agora_refptr<rtc::IVideoFrameTransceiver> transceiver, const char* id) = 0;
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createCustomVideoTrackLLApiInternal(agora_refptr<rtc::IVideoFrameSender> videoSource, const char* id) = 0;
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createCustomVideoTrackLLApiInternal(agora_refptr<rtc::IVideoEncodedImageSender> videoSource, const rtc::SenderOptions& options, const char* id = nullptr) = 0;
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createCustomVideoTrackLLApiInternal(agora_refptr<rtc::IMediaPacketSender> source, const char* id = nullptr) = 0;
#if defined(__ANDROID__) || (defined(TARGET_OS_IPHONE) && TARGET_OS_IPHONE)
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createScreenCaptureVideoTrackLLApiInternal(agora_refptr<rtc::IScreenCapturer2> screen) = 0;
  virtual agora_refptr<rtc::ILocalAudioTrackEx> createScreenCaptureAudioTrackLLApiInternal(agora_refptr<rtc::IScreenCapturer2> screen) = 0;
#else
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createScreenCaptureVideoTrackLLApiInternal(agora_refptr<rtc::IScreenCapturer> screen, const char* id) = 0;
#endif
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createMediaPlayerVideoTrackLLApiInternal(agora_refptr<rtc::IMediaPlayerSource> playerVideoSource, const char* id = nullptr) = 0;
  virtual agora_refptr<rtc::ILocalVideoTrackEx> createMediaStreamingVideoTrackLLApiInternal(agora_refptr<rtc::IMediaStreamingSource> streamingSource, const char* id = nullptr) = 0;
  virtual agora_refptr<rtc::IRtmpStreamingService> createRtmpStreamingServiceLLApiInternal(agora_refptr<rtc::IRtcConnection> rtcConnection, const char* appId) = 0;
  virtual agora_refptr<rtc::IMediaRelayService> createMediaRelayServiceLLApiInternal(agora_refptr<rtc::IRtcConnection> rtcConnection, const char* appId) = 0;
  virtual agora_refptr<rtc::IAudioDeviceManager> createAudioDeviceManagerComponentLLApiInternal(rtc::IAudioDeviceManagerObserver* observer) = 0;
  virtual agora_refptr<rtc::IFileUploaderService> createFileUploadServiceLLApiInternal(agora_refptr<rtc::IRtcConnection> rtcConnection, const char* appId) = 0;
  virtual agora_refptr<ILocalDataChannel> createLocalDataChannelLLApiInternal( const DataChannelConfig& config) = 0;
  virtual agora_refptr<rtc::IConfigCenter> getConfigCenterLLApiInternal() = 0;
  virtual agora_refptr<base::ISyncClientEx> createSyncClientLLApiInternal(const SyncConfig& config) = 0;
  virtual int addExtensionObserverLLApiInternal(agora::agora_refptr<agora::rtc::IMediaExtensionObserver> observer) = 0;
  virtual int removeExtensionObserverLLApiInternal(agora::agora_refptr<agora::rtc::IMediaExtensionObserver> observer) = 0;
  virtual const char* getExtensionIdLLApiInternal(const char* provider_name, const char* extension_name) = 0;
  virtual int enableExtensionLLApiInternal(const char* provider_name, const char* extension_name, const char* track_id, bool auto_enable_on_track) = 0;
  virtual int disableExtensionLLApiInternal(const char* provider_name, const char* extension_name, const char* track_id) = 0;
  virtual int32_t setAppType(int appType, aosl_ref_t ares = AOSL_REF_INVALID) = 0;
  virtual int32_t setAppTypeLLApiInternal(int appType) = 0;
  /**
   * Start trace with mask and max ring buffer size: count.
   *
   * @return
   *
   * - -1: Service don't start or start trace failure.
   * - 1: Success, and do nothing if it already started.
   */
  virtual int startTrace(uint32_t count, uint64_t mask) = 0;
  /**
   * stop trace, and save log in file_path.
   *
   * @return
   *
   * - -1: Service don't start
   * - 1: Success, and do nothing if it already stoped
   */
  virtual int stopTrace(const char* file_path) = 0;

  /**
   * Sets the external audio sink.
   *
   * This method applies to scenarios where you want to use external audio
   * data for playback.
   *
   * @param enabled
   * - true: Enables the external audio sink.
   * - false: Disables the external audio sink.
   * @param sampleRate Sets the sample rate (Hz) of the external audio sink, which can be set as 16000, 32000, 44100 or 48000.
   * @param channels Sets the number of audio channels of the external
   * audio sink:
   * - 1: Mono.
   * - 2: Stereo.
   *
   * @return
   * - 0: Success.
   * - < 0: Failure.
   */
  virtual int setExternalAudioSink(bool enabled, int sampleRate, int channels) = 0;

  /**
   * Pulls the playback PCM audio data from all the channel.
   *
   * @param[out] payloadData The pointer to the playback PCM audio data.
   * @param[in] audioFrameInfo The reference to the information of the PCM audio data: \ref agora::rtc::AudioPcmDataInfo "AudioPcmDataInfo".
   * @return
   * - 0: Success.
   * - < 0: Failure.
   */
  virtual int pullPlaybackAudioPcmData(void* payloadData, const rtc::AudioPcmDataInfo& audioFrameInfo) = 0;
#if defined(ENABLE_MEDIA_PLAYER)
  virtual aosl_ref_t createRhythmPlayer() = 0;

  virtual int destroyRhythmPlayer(aosl_ref_t ref_id) = 0;

  virtual aosl_ref_t createMediaPlayerLLApiInternal(media::base::MEDIA_PLAYER_SOURCE_TYPE type, int kind = 0) = 0;

  virtual aosl_ref_t getMediaPlayerLLApiInternal(int mediaPlayerId) = 0;

  virtual int destroyMediaPlayerLLApiInternal(aosl_ref_t ref_id) = 0;
  
#endif


  virtual int unregisterServiceEventObserver(IServiceObserver* observer) = 0;

  virtual commons::io_engine_base* getIoEngine() = 0;

 protected:
  virtual ~IAgoraServiceEx() {}
};

class IAgoraServiceObserver{
 public:
  virtual ~IAgoraServiceObserver() = default;

  virtual void onLocalUserRegistered(rtc::uid_t uid, const char* userAccount) = 0;
};

IAgoraServiceEx* GetService();

}  // namespace base
}  // namespace agora
