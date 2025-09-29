//
//  Agora Media SDK
//
//  Created by Rao Qi in 2019.
//  Copyright (c) 2019 Agora IO. All rights reserved.
//
#pragma once

#include <memory>

#include "AgoraRefPtr.h"
#include "AgoraBase.h"

#include "NGIAgoraAudioTrack.h"

#include "track_stat_i.h"
#include "video_config_i.h"

namespace agora {
namespace rtc {

class AudioState;
class AudioNodeBase;
struct PacketStats;

class ILocalAudioTrackEx : public ILocalAudioTrack {
 public:
  enum DetachReason { MANUAL, TRACK_DESTROY, MIXER_DESTROY };
  struct DetachOption {
    Optional<bool> sync_destroy;
    Optional<bool> detach_default_audio_state;
  };

 public:
  ILocalAudioTrackEx() {}
  virtual ~ILocalAudioTrackEx() {}

  virtual void attach(agora_refptr<agora::rtc::AudioState> audioState,
                      std::shared_ptr<AudioNodeBase> audioNetworkSink, uint32_t sourceId) = 0;
  virtual void detach(DetachReason reason) = 0;

  virtual void setAudioFrameSendDelayMs(int32_t delay_ms) {}

  virtual int ClearSenderBuffer() {
    return -ERR_NOT_SUPPORTED;
  }

  virtual int setExtraDelay(int delay_ms) {
    return -ERR_NOT_SUPPORTED;
  }

  virtual bool getStatistics(PacketStats& stats) { return true; }

  virtual bool isMediaPacketTrack() { return false; }

  virtual bool isEncodedFrameTrack() { return false; }
  
  virtual int enableMusicMode(bool enable) {
    return -ERR_NOT_SUPPORTED;
  }

  virtual int setDetachOption(DetachOption& option) {
    return -ERR_NOT_SUPPORTED;
  }
  virtual int enableEarMonitorLLApiInternal(bool enable, int includeAudioFilters) = 0;
  virtual ILocalAudioTrack::LocalAudioTrackStats GetStatsLLApiInternal() = 0;
  virtual int setEnabledLLApiInternal(bool enable) = 0;
  virtual bool isEnabledLLApiInternal() const = 0;
  virtual bool addAudioFilterLLApiInternal(agora_refptr<IAudioFilter> filter, AudioFilterPosition position, const ExtensionContext& extContext = {}) = 0;
  virtual bool removeAudioFilterLLApiInternal(agora_refptr<IAudioFilter> filter, AudioFilterPosition position) = 0;
  virtual int enableAudioFilterLLApiInternal(const char* id, bool enable, AudioFilterPosition position) {return -1;};
  virtual int setFilterPropertyLLApiInternal(const char* id, const char* key, const char* jsonValue, AudioFilterPosition position){return -1;};
  virtual int getFilterPropertyLLApiInternal(const char* id, const char* key, char* jsonValue, size_t bufSize, AudioFilterPosition position){return -1;};
  virtual agora_refptr<IAudioFilter> getAudioFilterLLApiInternal(const char* name, AudioFilterPosition position) const = 0;
  virtual int adjustPlayoutVolumeLLApiInternal(int volume) = 0;
  virtual int getPlayoutVolumeLLApiInternal(int* volume) = 0;
  virtual int adjustPublishVolumeLLApiInternal(int volume) = 0;
  virtual int getPublishVolumeLLApiInternal(int* volume) = 0;
  virtual int enableLocalPlaybackLLApiInternal(bool enable, bool sync = true) = 0;
  virtual bool addAudioSinkLLApiInternal(agora_refptr<IAudioSinkBase> sink, const AudioSinkWants& wants) = 0;
  virtual bool removeAudioSinkLLApiInternal(agora_refptr<IAudioSinkBase> sink) = 0;
  virtual LOCAL_AUDIO_STREAM_STATE getStateLLApiInternal()  = 0;
  virtual int registerTrackObserverLLApiInternal(ILocalAudioTrackObserver* observer) = 0;
  virtual int unregisterTrackObserverLLApiInternal(ILocalAudioTrackObserver* observer) = 0;
  virtual bool enforceFilterCompositesReadyLLApiInternal() = 0;
  virtual void setMaxBufferedAudioFrameNumberApiInternal(int number) = 0;
};

class IRemoteAudioTrackEx : public IRemoteAudioTrack {
  using RemoteAudioEvents = StateEvents<REMOTE_AUDIO_STATE, REMOTE_AUDIO_STATE_REASON>;  
 public:
  IRemoteAudioTrackEx() : notifier_(REMOTE_AUDIO_STATE_STOPPED) {}

  virtual ~IRemoteAudioTrackEx() {}

  void NotifyTrackStateChange(uint64_t ts, REMOTE_AUDIO_STATE state, REMOTE_AUDIO_STATE_REASON reason) {
    notifier_.Notify(ts, state, reason);
  }

  virtual void SetExternalJitterInfo(int32_t audio_jitter95, int32_t video_jitter95, bool receiving_video) = 0;
    
  RemoteAudioEvents GetEvents() {
    return notifier_.GetEvents();
  }

  virtual int GetAudioLevel() { return 0; }
  virtual REMOTE_AUDIO_STATE getStateLLApiInternal() = 0;
  virtual bool getStatisticsLLApiInternal(RemoteAudioTrackStats& stats) = 0;
  virtual int adjustPlayoutVolumeLLApiInternal(int volume) = 0;
  virtual int getPlayoutVolumeLLApiInternal(int* volume) = 0;
  virtual int setPlayoutSignalLoudnessLLApiInternal(float loudness) = 0;
  virtual bool addAudioFilterLLApiInternal(agora_refptr<IAudioFilter> filter, AudioFilterPosition position, const ExtensionContext &extConetxt = {}) = 0;
  virtual bool removeAudioFilterLLApiInternal(agora_refptr<IAudioFilter> filter, AudioFilterPosition position) = 0;
  virtual agora_refptr<IAudioFilter> getAudioFilterLLApiInternal(const char* name, AudioFilterPosition position) const = 0;
  virtual int registerMediaPacketReceiverLLApiInternal(IMediaPacketReceiver* packetReceiver) = 0;
  virtual int unregisterMediaPacketReceiverLLApiInternal(IMediaPacketReceiver* packetReceiver) = 0;
  virtual int registerAudioEncodedFrameReceiverLLApiInternal(IAudioEncodedFrameReceiver* packetReceiver, const AudioEncFrameRecvParams& recvParams) = 0;
  virtual int unregisterAudioEncodedFrameReceiverLLApiInternal(IAudioEncodedFrameReceiver* packetReceiver) = 0;
  virtual int setRemoteVoicePositionLLApiInternal(float pan, float gain) = 0;
  virtual int adjustAudioAccelerationLLApiInternal(int percentage) = 0;
  virtual int adjustAudioDecelerationLLApiInternal(int percentage) = 0;
  virtual int adjustDecodedAudioVolumeLLApiInternal(int decoded_index, int volume) = 0;
  virtual int enableSpatialAudioLLApiInternal(bool enabled) = 0;
  virtual bool addAudioSinkLLApiInternal(agora_refptr<IAudioSinkBase> sink, const AudioSinkWants& wants) = 0;
  virtual bool removeAudioSinkLLApiInternal(agora_refptr<IAudioSinkBase> sink) = 0;
  virtual int setRemoteUserSpatialAudioParamsLLApiInternal(const agora::SpatialAudioParams& params) = 0;
  virtual int enableAudioFilterLLApiInternal(const char* id, bool enable, AudioFilterPosition position) = 0;
  virtual int setFilterPropertyLLApiInternal(const char* id, const char* key, const char* jsonValue, AudioFilterPosition position) = 0;
  virtual int getFilterPropertyLLApiInternal(const char* id, const char* key, char* jsonValue, size_t bufSize, AudioFilterPosition position) = 0;
 protected:
  StateNotifier<REMOTE_AUDIO_STATE, REMOTE_AUDIO_STATE_REASON> notifier_;
};

}  // namespace rtc
}  // namespace agora
