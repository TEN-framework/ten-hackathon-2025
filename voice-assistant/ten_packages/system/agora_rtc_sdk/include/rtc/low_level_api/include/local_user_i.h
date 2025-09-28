//
//  Agora Media SDK
//
//  Created by Sting Feng in 2015-05.
//  Copyright (c) 2015 Agora IO. All rights reserved.
//
#pragma once

#include <string>
#include <vector>

#include "IAgoraService.h"
#include "NGIAgoraLocalUser.h"
#include "NGIAgoraMediaNode.h"
#include "NGIAgoraRtcConnection.h"
#include "NGIAgoraAudioTrack.h"
#include "audio_options_i.h"
#include "channel_capability_i.h"

namespace agora {

namespace rtc {

struct TConnectionInfo;

struct audio_packet_t;
struct SAudioFrame;
struct video_packet_t;
struct control_broadcast_packet_t;
struct CallBillInfo;
class IMetadataObserver;
class IStrategyManager;
class ProactiveCaller;

class ITransportPacketObserver {
 public:
  virtual ~ITransportPacketObserver() {}
  virtual int onAudioPacket(const agora::rtc::TConnectionInfo& connectionInfo,
                            const audio_packet_t& p, int64_t packet_ssrc) = 0;
  virtual int onVideoPacket(const agora::rtc::TConnectionInfo& connectionInfo,
                            const video_packet_t& p) = 0;
  virtual int onControlBroadcastPacket(const agora::rtc::TConnectionInfo& connectionInfo,
                                       control_broadcast_packet_t& p) = 0;
  virtual int onDataStreamPacket(const agora::rtc::TConnectionInfo& connectionInfo,
                                 agora::rtc::uid_t uid, uint16_t streamId, const char* data,
                                 size_t length) = 0;
};

// Audio frame dump position for sending.
extern const std::string AUDIO_PIPELINE_POS_RECORD_ORIGIN;
extern const std::string AUDIO_PIPELINE_POS_APM;
extern const std::string AUDIO_PIPELINE_POS_PRE_SEND_PROC;
extern const std::string AUDIO_PIPELINE_POS_ENC;
extern const std::string AUDIO_PIPELINE_POS_TX_MIXER;
extern const std::string AUDIO_PIPELINE_POS_AT_RECORD;
extern const std::string AUDIO_PIPELINE_POS_ATW_RECORD;

// Audio frame dump position for receiving.
extern const std::string AUDIO_PIPELINE_POS_DEC;
extern const std::string AUDIO_PIPELINE_POS_PLAY;
extern const std::string AUDIO_PIPELINE_POS_RX_MIXER;
extern const std::string AUDIO_PIPELINE_POS_PLAYBACK_MIXER;
extern const std::string AUDIO_PIPELINE_POS_PCM_SOURCE_PLAYBAC_MIXER;
extern const std::string AUDIO_PIPELINE_POS_PRE_PLAY_PROC;
extern const std::string AUDIO_PIPELINE_POS_AT_PLAYOUT;
extern const std::string AUDIO_PIPELINE_POS_ATW_PLAYOUT;

const int64_t AUDIO_FRAME_DUMP_MIN_DURATION_MS = 0;
const int64_t AUDIO_FRAME_DUMP_MAX_DURATION_MS = 150000;

class IAudioFrameDumpObserver {
 public:
  virtual ~IAudioFrameDumpObserver() = default;
  virtual void OnAudioFrameDumpCompleted(const std::string& location, const std::string& uuid,
                                         const std::vector<std::string>& files) = 0;
};

struct CapabilityItem {
  uint8_t id;
  const char* name;
  CapabilityItem() : id(0), name(nullptr) {}
  CapabilityItem(uint8_t i, const char* n) : id(i), name(n) {}
};

struct CapabilityItemMap {
  CapabilityItem* item;
  size_t size;
  CapabilityItemMap() : item(nullptr), size(0) {}
  CapabilityItemMap(CapabilityItem* i, size_t s) : item(i), size(s) {}
};

struct Capabilities {
  CapabilityItemMap* item_map;
  agora::capability::CapabilityType type;
  Capabilities() : item_map(nullptr), type(agora::capability::CapabilityType::kChannelProfile) {}
  Capabilities(CapabilityItemMap* i, agora::capability::CapabilityType t) : item_map(i), type(t) {}
};

class ICapabilitesObserver {
 public:
  virtual void OnCapabilitesChanged(const Capabilities* capabilities, size_t size){};
  virtual ~ICapabilitesObserver() = default;
};

struct LayoutInternal
{
  std::string cname;
  uint32_t uid;
  uint32_t rx;
  uint32_t ry;
  uint32_t rw;
  uint32_t rh;
  uint32_t videoState; //0 for Video, 1 for placeholderimage, 2 for BlackgroundImage, 3 for frame
};
class VideoLayoutInfoInternal {
public:
  std::string service;
  uint32_t width;
  uint32_t height;
  uint32_t layoutSize;
  std::vector<LayoutInternal> uidlayout;
};
class IVideoLayoutObserver {
public:
  virtual void onLayoutInfo(const char* channelId,uid_t localUid, uid_t uid, VideoLayoutInfoInternal info) = 0;
  virtual ~IVideoLayoutObserver(){}
};

class ILocalUserEx : public rtc::ILocalUser {
 public:
  virtual int initialize() = 0;
  // We should deprecate sendAudioPacket.
  virtual int sendAudioPacket(const audio_packet_t& packet, int64_t packet_ssrc = 0, int delay = 0) = 0;

  virtual int sendVideoPacket(const video_packet_t& packet) = 0;
  virtual int sendControlBroadcastPacket(control_broadcast_packet_t& p) = 0;

  virtual int sendDataStreamPacket(uint16_t streamId, const char* data, size_t length) = 0;

  // No-thread safe, it must be called before joinChannel().
  // No unregister method provided to simplify internal logic.
  virtual int registerTransportPacketObserver(ITransportPacketObserver* observer) = 0;

  // internal usage
  virtual int setAudioOptions(const rtc::AudioOptions& options) = 0;
  virtual int getAudioOptions(rtc::AudioOptions* options) = 0;
  virtual int setAdvancedAudioOptions(const rtc::AudioOptions& options, int sourceType) = 0;
  virtual void getBillInfo(CallBillInfo* bill_info) = 0;

  virtual void forceDeviceScore(int32_t deviceScore) = 0;
  virtual int setPrerendererSmoothing(bool enabled) = 0;
  virtual int setDtx(bool enabled) = 0;
  virtual int setCustomAudioBitrate(int bitrate) = 0;
  virtual int setCustomAudioPayloadType(int payloadtype) = 0;
  virtual int setCustomAudioChannelNum(int channelNum) = 0;
  virtual int setCustomAudioSampleRate(int sampleRate) = 0;
  virtual int setAudioFrameSizeMs(int sizeMs) = 0;
  virtual int setAudioCC(bool value) = 0;

  virtual int registerAudioFrameDumpObserver(IAudioFrameDumpObserver* observer) = 0;
  virtual int unregisterAudioFrameDumpObserver(IAudioFrameDumpObserver* observer) = 0;

  virtual int startAudioFrameDump(const std::string& location, const std::string& uuid,
                                  const std::string& passwd, int64_t duration_ms,
                                  bool auto_upload, aosl_ref_t ares = AOSL_REF_INVALID) = 0;
  virtual int stopAudioFrameDump(const std::string& location) = 0;
  virtual int startAudioRecordingLLApiInternal(const agora_refptr<agora::rtc::IAudioSinkBase>& audioSink,const AudioSinkWants& wants = AudioSinkWants{}) = 0;
  virtual int stopAudioRecordingLLApiInternal() = 0;
  
  virtual int enalbeSyncRenderNtpBroadcast(bool enable_sync_render_ntp_broadcast) = 0;
  virtual int enalbeSyncRenderNtpAudience(bool enable_sync_render_ntp_audience) = 0;
  virtual int enableStablePlayout(bool enable_stable_playout) = 0;
  virtual int setPlayoutUserAnonymous(rtc::uid_t uid, bool anonymous) = 0;
  virtual int muteRemoteFromTimestamp(rtc::uid_t uid, uint32_t timestamp) = 0;
  virtual int unmuteRemoteFromTimestamp(rtc::uid_t uid, uint32_t timestamp) = 0;
  virtual int adjustAudioAcceleration(rtc::uid_t uid, int percent) = 0;
  virtual int adjustAudioDeceleration(rtc::uid_t uid, int percent) = 0;
  virtual int enableAudioPlayout(bool enabled) = 0;
  virtual int setAudioMaxTargetDelay(int delay) = 0;
  virtual int adjustDecodedAudioVolume(rtc::uid_t uid, int decoded_index, int volume) = 0;

  virtual void registerVideoMetadataObserver(IMetadataObserver* observer) = 0;
  virtual void unregisterVideoMetadataObserver(IMetadataObserver* observer) = 0;
  virtual void registerVideoLayoutObserver(IVideoLayoutObserver* observer) = 0;
  virtual void unregisterVideoLayoutObserver(IVideoLayoutObserver* observer) = 0;

  using ILocalUser::registerLocalVideoEncodedFrameObserver;
  using ILocalUser::unregisterLocalVideoEncodedFrameObserver;

  using ILocalUser::registerVideoEncodedFrameObserver;
  using ILocalUser::unregisterVideoEncodedFrameObserver;

  virtual int setVideoFrameObserver(agora::media::IVideoFrameObserver* observer) = 0;

  virtual int setExtendPlatformRenderer(agora::media::IVideoFrameObserver* renderer) = 0;

  virtual agora_refptr<IRemoteVideoTrack> getRemoteVideoTrack(rtc::uid_t uid) = 0;

  virtual int setAVSyncPeer(rtc::uid_t uid) = 0;
  virtual int getOnlySubscribeEncodedVideoFrame(user_id_t peerUid, bool& subscribe) = 0;
  virtual void setMinPlayoutDelay(int delay) = 0;
  virtual int setAllowSubscribeSelf(bool allow) = 0;
  virtual int adjustRecordingSignalVolume(int volume) = 0;
  virtual int enableDownlinkNoiseGate(int noise_gate) = 0;
  virtual int setDownlinkSignalLoudness(float loudness_lkfs) = 0;
  virtual int setUplinkSignalLoudness(float loudness_lkfs) = 0;
  virtual int enableDownlinkRawAudioLevelReport(bool enable) = 0;
  virtual int enableAudioLevelReportInDecibel(bool enable) = 0;
  virtual int getRecordingSignalVolume(int* volume) = 0;
  virtual bool ForcePeriodicKeyFrame() = 0;
  virtual int registerCapabilitiesObserver(ICapabilitesObserver* cap_observer) = 0;
  virtual int unRegisterCapabilitiesObserver(ICapabilitesObserver* cap_observer) = 0;
  virtual void updateAppDefinedCapabilities(const Capabilities* cap, size_t size) = 0;
  virtual int sendIntraRequestQuick(user_id_t uid) = 0;
  virtual int sendIntraRequestLLApiInternal(user_id_t userId, VIDEO_STREAM_TYPE stream_type = VIDEO_STREAM_HIGH) = 0;
  // this function should only be used in media_relay
  // In the media_relay case, there are no track to help video_stream_manager get the video_height
  // and video_width just receive the video packets and send this function used to help us
  // UpdateBillInfo by ourself
  virtual void customUpdateBillInfo(int height, int width, bool isSendingVideo) = 0;
  virtual void setInteractiveAudience(bool interactive) = 0;
  virtual int setVideoDumpMode(int mode, bool enabled, int frame_cnt = -1) = 0;
  virtual int enableVideoDecryptedV4StreamDump(bool enabled) = 0;
  
  virtual void muteLocalAudioStream(bool mute) = 0;
  virtual void muteMicrophone(bool mute) = 0;

  using ILocalUser::registerAudioSpectrumObserver;
  using ILocalUser::unregisterAudioSpectrumObserver;

  virtual int setUserRoleLLApiInternal(rtc::CLIENT_ROLE_TYPE role) = 0;
  virtual CLIENT_ROLE_TYPE getUserRoleLLApiInternal() = 0;
  virtual int setAudienceLatencyLevelLLApiInternal(rtc::AUDIENCE_LATENCY_LEVEL_TYPE level, int role) = 0;
  virtual bool getLocalAudioStatisticsLLApiInternal(LocalAudioDetailedStats& stats) = 0;
  virtual int publishVideoLLApiInternal(agora_refptr<ILocalVideoTrack> videoTrack) = 0;
  virtual int unpublishVideoLLApiInternal(agora_refptr<ILocalVideoTrack> videoTrack) = 0;
  virtual int setVideoSubscriptionOptionsLLApiInternal(user_id_t userId, const VideoSubscriptionOptions& options) = 0;
  virtual int subscribeVideoLLApiInternal(user_id_t userId, const agora::rtc::VideoSubscriptionOptions& subscriptionOptions) = 0;
  virtual int subscribeAllVideoLLApiInternal( const agora::rtc::VideoSubscriptionOptions& subscriptionOptions) = 0;
  virtual int unsubscribeVideoLLApiInternal(user_id_t userId) = 0;
  virtual int unsubscribeAllVideoLLApiInternal() = 0;
  virtual int publishAudioLLApiInternal(agora_refptr<ILocalAudioTrack> audioTrack) = 0;
  virtual int unpublishAudioLLApiInternal(agora_refptr<ILocalAudioTrack> audioTrack) = 0;
  virtual int subscribeAudioLLApiInternal(user_id_t userId) = 0;
  virtual int subscribeAllAudioLLApiInternal() = 0;
  virtual int unsubscribeAudioLLApiInternal(user_id_t userId) = 0;
  virtual int unsubscribeAllAudioLLApiInternal() = 0;
  virtual int adjustPlaybackSignalVolumeLLApiInternal(int volume) = 0;
  virtual int getPlaybackSignalVolumeLLApiInternal(int* volume) = 0;
  virtual int adjustUserPlaybackSignalVolumeLLApiInternal(user_id_t userId, int volume) = 0;
  virtual int getUserPlaybackSignalVolumeLLApiInternal(user_id_t userId, int* volume) = 0;
  virtual int setUserPlaybackSignalLoudnessLLApiInternal(user_id_t userId, float loudness) = 0;
  virtual int setAudioScenarioLLApiInternal(AUDIO_SCENARIO_TYPE scenario) = 0;
  virtual int setAudioEncoderConfigurationLLApiInternal(const AudioEncoderConfiguration& config) = 0;
  virtual int setPlaybackAudioFrameParametersLLApiInternal(size_t numberOfChannels, uint32_t sampleRateHz, RAW_AUDIO_FRAME_OP_MODE_TYPE mode, int samplesPerCall) = 0;
  virtual int setRecordingAudioFrameParametersLLApiInternal(size_t numberOfChannels, uint32_t sampleRateHz, RAW_AUDIO_FRAME_OP_MODE_TYPE mode, int samplesPerCall) = 0;
  virtual int setMixedAudioFrameParametersLLApiInternal(size_t numberOfChannels, uint32_t sampleRateHz, int samplesPerCall) = 0;
  virtual int setEarMonitoringAudioFrameParametersLLApiInternal(bool enabled, size_t numberOfChannels, uint32_t sampleRateHz, RAW_AUDIO_FRAME_OP_MODE_TYPE mode, int samplesPerCall) = 0;
  virtual int setPlaybackAudioFrameBeforeMixingParametersLLApiInternal(size_t numberOfChannels, uint32_t sampleRateHz, int samplesPerCall) = 0;
  virtual int registerAudioFrameObserverLLApiInternal(agora::media::IAudioFrameObserverBase* observer) = 0;
  virtual int unregisterAudioFrameObserverLLApiInternal(agora::media::IAudioFrameObserverBase* observer) = 0;
  virtual int enableAudioSpectrumMonitorLLApiInternal(int intervalInMS) = 0;
  virtual int disableAudioSpectrumMonitorLLApiInternal() = 0;
  virtual int registerAudioSpectrumObserverLLApiInternal( agora::media::IAudioSpectrumObserver* observer, void (*safeDeleter)(agora::media::IAudioSpectrumObserver*)) = 0;
  virtual int unregisterAudioSpectrumObserverLLApiInternal(agora::media::IAudioSpectrumObserver* observer) = 0;
  virtual int registerLocalVideoEncodedFrameObserverLLApiInternal( agora::media::IVideoEncodedFrameObserver* observer) = 0;
  virtual int unregisterLocalVideoEncodedFrameObserverLLApiInternal( agora::media::IVideoEncodedFrameObserver* observer) = 0;
  virtual int forceNextIntraFrameLLApiInternal() = 0;
  virtual int registerVideoEncodedFrameObserverLLApiInternal( agora::media::IVideoEncodedFrameObserver* observer) = 0;
  virtual int unregisterVideoEncodedFrameObserverLLApiInternal( agora::media::IVideoEncodedFrameObserver* observer) = 0;
  virtual int registerVideoFrameObserverLLApiInternal(IVideoFrameObserver2* observer) = 0;
  virtual int unregisterVideoFrameObserverLLApiInternal(IVideoFrameObserver2* observer) = 0;
  virtual int setVideoFrameObserverLLApiInternal(agora::media::IVideoFrameObserver* observer) = 0;
  virtual int setExtendPlatformRendererLLApiInternal(agora::media::IVideoFrameObserver* renderer) = 0;
  using internal_user_id_t = std::string;
  virtual int setSubscribeAudioBlocklistLLApiInternal(const std::vector<internal_user_id_t>& userIdList) = 0;
  virtual int setSubscribeAudioAllowlistLLApiInternal(const std::vector<internal_user_id_t>& userIdList) = 0;
  virtual int setSubscribeVideoBlocklistLLApiInternal(const std::vector<internal_user_id_t>& userIdList) = 0;
  virtual int setSubscribeVideoAllowlistLLApiInternal(const std::vector<internal_user_id_t>& userIdList) = 0;
  virtual int setHighPriorityUserListLLApiInternal(const std::vector<uid_t>& vipList, int option) = 0;
  virtual int getHighPriorityUserListLLApiInternal(std::vector<uid_t>& vipList, int& option) = 0;
  virtual int setRemoteSubscribeFallbackOptionLLApiInternal(int option) = 0;
  virtual int registerLocalUserObserverLLApiInternal(ILocalUserObserver* observer, void (*safeDeleter)(ILocalUserObserver*) = NULL) = 0;
  virtual int unregisterLocalUserObserverLLApiInternal(ILocalUserObserver* observer) = 0;
  virtual int setAudioVolumeIndicationParametersLLApiInternal(int intervalInMS, int smooth, bool reportVad) = 0;
  virtual int registerMediaControlPacketReceiverLLApiInternal( IMediaControlPacketReceiver* ctrlPacketReceiver) = 0;
  virtual int unregisterMediaControlPacketReceiverLLApiInternal( IMediaControlPacketReceiver* ctrlPacketReceiver) = 0;
  virtual int enableSoundPositionIndicationLLApiInternal(bool enabled) = 0;
  virtual int setRemoteVoicePositionLLApiInternal(user_id_t userId, double pan, double gain) = 0;
  virtual int enableSpatialAudioLLApiInternal(bool enabled) = 0;
  virtual int setRemoteUserSpatialAudioParamsLLApiInternal(user_id_t userId, const agora::SpatialAudioParams& param) = 0;
  virtual int setAudioFilterableLLApiInternal(bool filterable) = 0;
  virtual int publishDataChannelLLApiInternal(agora_refptr<ILocalDataChannel> channel) = 0;
  virtual int unpublishDataChannelLLApiInternal(agora_refptr<ILocalDataChannel> channel) = 0;
  virtual int subscribeDataChannelLLApiInternal(user_id_t userId, int channelId) = 0;
  virtual int unsubscribeDataChannelLLApiInternal(user_id_t userId, int channelId) = 0;
  virtual int registerDataChannelObserverLLApiInternal(IDataChannelObserver* observer) = 0;
  virtual int unregisterDataChannelObserverLLApiInternal(IDataChannelObserver* observer) = 0;
  virtual int takeDataChannelSnapshotLLApiInternal() = 0;
  virtual int enableRemoteAudioTrackFilterLLApiInternal(user_id_t userId, const char* id, bool enable) = 0;
  virtual int setRemoteAudioTrackFilterPropertyLLApiInternal(user_id_t userId, const char* id, const char* key, const char* jsonValue) = 0;
  virtual int getRemoteAudioTrackFilterPropertyLLApiInternal(user_id_t userId, const char* id, const char* key, char* jsonValue, size_t bufSize) = 0;
  virtual int initializeLLApiInternal() = 0;
  virtual int SetAudioNsModeLLApiInternal(bool NsEnable, NS_MODE NsMode, NS_LEVEL NsLevel, NS_DELAY NsDelay) = 0;
  virtual int EnableLocalMixedAudioTrackLLApiInternal(agora_refptr<ILocalAudioTrack>& track, bool enable, bool MixLocal, bool MixRemote) = 0;
  virtual int setVideoScenarioLLApiInternal(VIDEO_APPLICATION_SCENARIO_TYPE scenarioType) = 0;
  virtual int setVideoQoEPreferenceLLApiInternal(VIDEO_QOE_PREFERENCE_TYPE qoePreference) = 0;
  virtual rtc::IStrategyManager* getStrategyManager() = 0;
  virtual rtc::ProactiveCaller* getStrategyProactiveCaller() = 0;
  virtual int setExternalAudioSinkMix(bool enabled) = 0;
  virtual int sendAudioMetadataLLApiInternal(const char* metadata, size_t length) = 0;
};

}  // namespace rtc
}  // namespace agora
