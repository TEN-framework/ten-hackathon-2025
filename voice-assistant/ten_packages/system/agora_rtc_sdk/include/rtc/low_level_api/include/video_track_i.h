//
//  Agora Media SDK
//
//  Created by Rao Qi in 2019.
//  Copyright (c) 2019 Agora IO. All rights reserved.
//
#pragma once

#include <atomic>
#include <memory>
#include <mutex>
#include <unordered_map>
#include <vector>

#include "AgoraBase.h"
#include "AgoraMediaBase.h"
#include "AgoraOptional.h"
#include "NGIAgoraVideoTrack.h"
#include <api/cpp/aosl_ares_class.h>
#include "api/transport/network_types.h"
#include "api/video/video_content_type.h"
#include "call/rtp_config.h"

#include "rtc_connection_i.h"
#include "track_stat_i.h"
#include "video_config_i.h"
#include "common_defines.h"
#include "video_node_i.h"

#include "main/core/video/multi_stream_subscribe_interface.h"
#include "facilities/media_config/policy_chain/media_config_policy_chain.h"
#include "facilities/tools/weak_observers.h"
#include "facilities/media_config/policy_chain/general_val_policy_chain.h"
#include "main/core/video/strategy_framework/module_controller/video_module_control_aspect.h"
#include "main/core/video/stats_and_events/video_stats_events_base.h"
namespace webrtc {
  class IFecMethodFactoryInterface;
  class ISmoothRender;
  class IRsfecCodecFactoryInterface;
  class IAutoAdjustHarq;
}

namespace agora {
namespace rtc {

class VideoNodeRtpSink;
class VideoNodeRtpSource;
class ProactiveCaller;
class IModuleControlPanel;

enum class InternalVideoSourceType : unsigned {
  None = 0,
  Camera = 1,
  Custom = 2,
  Screen = 3,
  CustomYuvSource = 4,
  CustomEncodedImageSource = 5,
  CustomPacketSource = 6,
  MixedSource = 7,
  TranscodedSource = 8,
};

enum VideoModuleId {
  VideoModuleCapture = 1,
  VideoModulePreprocess,
  VideoModuleEncode,
  VideoModuleNetwork,
  VideoModuleDecode,
  VideoModulePostprocess,
  VideoModuleRender,
  VideoModulePipeline,
  VideoModuleQoE,
};

enum VideoAvailabilityLevel {
  VideoAvailabilityLevel1 = 1,  // Completely unusable.
  VideoAvailabilityLevel2,      // Usable but with very poor experience.
  VideoAvailabilityLevel3,      // Usable but with poor experience.
};

// Events report. New enum can be added but do not change the existing value!
enum VideoPipelineEvent {
  kVideoUplinkEventStaticFrames = 1,  // Continous static frames, maybe green/black picktures.
};

enum VideoQoeEvent {
  kVideoQoeCriticalDrop = 1,
  kVideoQoe600msFreezeDrop = 2,
  kVideoQoe200msFreezeDrop = 3,
  kVideoQoeFpsSubstandard = 4,
  kVideoTimestampException = 5,
  kVideoQoePipelineException = 6,
  kVideoGlitchDetection = 7,
};

// Events report. New enum can be added but do not change the existing value!
enum VideoProcessEvent {
  kVideoProcessEventNone = 0,

  // These events report will be throttled, refer to VideoEngine::doReportVideoEvent().
  kVideoProcessEventPreprocessEnqueueFailure = 1000,
  kVideoProcessEventPreprocessFrameFailure = 1001,
  kVideoProcessEventPreprocessNoIncomingFrame = 1002,  // No incoming frame for builtin VPM module
  kVideoProcessEventPreprocessCongested = 1003,
};

// report hardware codec availability event.
enum VideoCodecAvailableEvent {
  kVideoHwH265EncoderAvailable = 2000,
  kVideoHwH264EncoderHighProfileAvailable = 2001,
};

enum VideoDumpMode {
  VIDEO_DUMP_DEFAULT = 0,  // Dump all.
  VIDEO_DUMP_ALL = 0xFFFF, // Dump all.
  VIDEO_DUMP_CAPTURED_YUV = (1 << 0), // Dump YUV after video capturing.
  VIDEO_DUMP_FILTERED_YUV = (1 << 1), // Dump YUV before video encoding.
  VIDEO_DUMP_ENCODED_STREAM = (1 << 2), // Dump stream after video encoding.
  VIDEO_DUMP_RECEIVED_STREAM = (1 << 3), // Dump stream before video decoding.
  VIDEO_DUMP_DECODED_YUV = (1 << 4), // Dump YUV after video decoding.
  VIDEO_DUMP_RENDERED_YUV = (1 << 5), // Dump YUV before video rendering.
  VIDEO_DUMP_PRE_ENCODER_YUV = (1 << 6), // Dump YUV right before video encoding.
};

struct VideoAvailabilityIndicator {
  VideoAvailabilityLevel level;
  VideoModuleId module;
  int code;
  uid_t uid;
  int extra;
  std::vector<agora::rtc::QoEDropInfo> extra2;
  std::vector<agora::rtc::VideoTimestampExceptionInfo> ts_exception_info;
  std::vector<GlitchDetectionInfo> glitch_detection_infos;
};

struct VideoQoEAnalyzerParameter {
  bool qoe_analyzer_enable = false;
  bool enable_video_diagnose_logger = true;
  int qoe_critical_report_max_times = 0;
  int qoe_high_report_max_times = 0;
  int qoe_normal_report_max_times = 0;
  int qoe_report_strategy = 0;
  int qoe_timing_strategy_report_period = 0;
};

class IVideoTrackObserver : public std::enable_shared_from_this<IVideoTrackObserver> {
 public:
  virtual ~IVideoTrackObserver() = default;
  virtual void onLocalVideoStateChanged(int id,
                                        LOCAL_VIDEO_STREAM_STATE state,
                                        LOCAL_VIDEO_STREAM_REASON reason,
                                        int timestamp_ms) {}

  virtual void onRemoteVideoStateChanged(uid_t uid,
                                         REMOTE_VIDEO_STATE state,
                                         REMOTE_VIDEO_STATE_REASON reason,
                                         int timestamp_ms) {}

  virtual void onFirstVideoFrameRendered(int id, uid_t uid, int width, int height, int timestamp_ms) {}

  virtual void onFirstVideoFrameDecoded(std::string cid, uid_t uid, uint32_t ssrc, int width, int height, int timestamp_ms) {}

  virtual void onFirstVideoKeyFrameReceived(uid_t uid, uint64_t timestamp, const webrtc::FirstVideoFrameStreamInfo &streamInfo) {}

  virtual void onSourceVideoSizeChanged(uid_t uid,
                                        int width, int height,
                                        int rotation, int timestamp_ms) {}
  virtual void onSendSideDelay(int id, int send_delay) {}
  virtual void onRecvSideDelay(uid_t uid, int recv_delay) {}
  virtual void onRecvSideFps(uid_t uid, int fps) {}
  virtual void onEncoderConfigurationChanged(const std::unordered_map<int, VideoConfigurationEx>& config) {}
  virtual void onVideoPipelineDataFormatChanged(int format) {}
  virtual void onCameraFacingChanged(int facing) {}
  virtual void onViewSizeChanged(uid_t uid, view_t view, int width, int height) {}
  virtual void OnSetRexferParams(bool fec_rexfer, float rexfer_alpha, int max_rexfer_times) {}
  virtual void OnRexferStatusUpdated(bool status, int32_t target_bitrate) {}
  virtual void OnNotifyDepartedFrame(uid_t uid, int picture_id) {}
  virtual void onCameraInfoListChanged(CameraInfoList cameraInfoList) {}
  virtual void onCameraCharacteristicProfileChanged(agora::rtc::CameraCharacteristicProfile profile) {}
  virtual void OnEncoderStatusUpdate(webrtc::VideoCodecType codec_type,
                                     webrtc::HW_ENCODER_ACCELERATING_STATUS hw_accelerate_status) {};
  virtual void OnVideoStatusUpdated(int status) {}
  virtual void onVideoAvailabilityIndicatorEvent(VideoAvailabilityIndicator indicator) {}
  virtual void onVideoHWCodecSpecEvent(agora::rtc::VideoHWCodecSpec codecSpec) {}
  virtual void onVideoSizeChanged(int id, uid_t uid, int width, int height, int rotation) {}

  virtual void onLocalAddVideoFilter(int track_id, std::string filter_name, bool enabled){}
  virtual void onLocalFilterStatusChanged(int track_id, std::string filter_name, bool enabled){}
  virtual void onRemoteAddVideoFilter(std::string cid, uid_t uid, uint32_t ssrc, std::string filter_name, bool enabled){}
  virtual void onRemoteFilterStatusChanged(std::string cid, uid_t uid, uint32_t ssrc, std::string filter_name, bool enabled, bool isDisableMe = false){}
  virtual void onVideoContentChanged(uid_t uid, agora::VideoContentType newType,
                             agora::VideoContentSubType newSubtype) {}
  virtual void OnRequestKeyFrame(uid_t uid, VIDEO_STREAM_TYPE type) {}
};

struct LocalVideoTrackStatsEx {
  LocalVideoTrackStats local_video_stats;
  int sent_loss_ratio;
  uint32_t total_bwe_bps;
  uint32_t total_video_send_target_bps;
  uint32_t media_send_bps;
  uint32_t qp;
};

class ILocalVideoTrackEx : public ILocalVideoTrack,
                           public VideoLocalTrackControlAspect {
 public:
  enum DetachReason { MANUAL, TRACK_DESTROY, NETWORK_DESTROY, CODEC_CHANGE};

  // keep the same as webrtc::RsfecConfig
  struct RsfecConfig {
    std::vector<int> fec_protection_factor;
    std::vector<std::vector<int>> fec_ratioLevel;
    std::vector<int> fec_rttThreshold;
    bool pec_enabled;
  };

  struct CaptureModeItem {
    int32_t mode = 0;
    int32_t scene = 0;
    int32_t policy = 0;
    std::string type = "";
  };

  struct AttachInfo {
    uint32_t uid;
    uint32_t cid;
    conn_id_t conn_id;
    VideoNodeRtpSink* network;
    WeakPipelineBuilder builder;
    uint64_t stats_space;
    CongestionControlType cc_type;
    bool enable_two_bytes_extension;
    webrtc::RsfecConfig rsfec_config;

    // hardware encoder related
    std::string enable_hw_encoder;
    std::string hw_encoder_provider;
    Optional<bool> low_stream_enable_hw_encoder;
    Optional<int> minscore_for_swh265enc;

    // video config
    VideoNodeEncoderEx::OPSParametersCollection ops_parameters;
    std::shared_ptr<webrtc::IAutoAdjustHarq> auto_adjust_harq;
    int harq_version;
    int32_t fec_outside_bandwidth_ratio;
    bool enable_minor_stream_vqc = false;
    bool enable_minor_stream_fec = false;
    bool enable_minor_stream_fec_outside_ratio = false;
    bool enable_minor_stream_intra_request = false;
		
    int fec_method;
    int dm_wsize;
    int dm_maxgc;
    std::string switch_to_rq;
    bool dm_lowred;
    bool enable_rq_classic_method;

    int32_t minimum_fec_level;
    int fec_fix_rate;
    int largest_ref_distance;
    bool enable_check_for_disable_fec;
    bool enable_quick_intra_high_fec = false; 
    absl::optional<int> max_inflight_frame_count_pre_processsing;

    // for intra request
    Optional<uint32_t> av_enc_intra_key_interval;

    Optional<uint32_t> av_enc_bitrate_adjustment_type;

    // enable video diagnose
    bool enable_video_send_diagnose;
    // video codec alignment
    Optional<uint32_t> hw_encoder_width_alignment;
    Optional<uint32_t> hw_encoder_height_alignment;
    Optional<bool> hw_encoder_force_alignment;
    Optional<bool> hw_enc_video_enable_dequeue_timeawait;
    Optional<bool> hw_enc_video_adjustment_reset;
    // video decode capablitys
    uint8_t negotiated_video_decode_caps;
    // hw video encode configure
    std::string hw_encoder_fotmat_config;
    Optional<uint32_t> hw_enc_hevc_exceptions;

    int hw_capture_delay;
    uint32_t sync_peer_uid;

    Optional<SIMULCAST_STREAM_MODE> cfg_simulcast_stream_mode;
    bool support_higher_standard_bitrate;
    VideoQoEAnalyzerParameter qoe_analyzer_parameters;
    bool local_video_attached;
    Optional<int> max_slices;
    Optional<int> major_stream_encoder_thread_num;
    Optional<int> minor_stream_encoder_thread_num;
    Optional<int> major_stream_h264_profile;
    Optional<int> minor_stream_h264_profile;
    Optional<int> key_frame_interval;
    Optional<int> max_qp;
    Optional<int> min_qp;
    Optional<std::string> av_enc_param_config;
    Optional<int> feedback_mode;
    Optional<bool> av_enc_new_complexity;
    Optional<int> av_enc_default_complexity;
    Optional<bool> response_quick_intra_request;
    Optional<int> number_of_temporal_layers;
    Optional<int> simulcast_stream_number_of_temporal_layers;
  };

  struct DetachInfo {
    VideoNodeRtpSink* network;
    DetachReason reason;
  };

  ILocalVideoTrackEx() : id_(id_generator_++) {}
  virtual ~ILocalVideoTrackEx() {}

  virtual bool hasPublished() = 0;

  virtual int setVideoEncoderConfigurationEx(const VideoEncoderConfiguration& config, utils::ConfigPriority priority = utils::CONFIG_PRIORITY_USER) = 0;

  virtual int SetVideoConfigEx(int index, const VideoConfigurationEx& configEx, utils::ConfigPriority priority = utils::CONFIG_PRIORITY_USER) = 0;

  virtual int ResetVideoConfigExByPriority(utils::ConfigPriority priority) = 0;

  virtual int GetConfigExs(std::unordered_map<int, VideoConfigurationEx>& configs, bool include_disable_config = false) = 0;

  virtual int GetVideoProfileAutoAdjsut(std::string& config_video_profile, std::string& actual_video_profile) = 0;
  
  virtual int GetCaptureMode(CaptureModeItem& captureModeOut) = 0;

  virtual void RequestKeyFrame(VIDEO_STREAM_TYPE type, bool is_quick_intra_request, bool internal) {}

  virtual void AddVideoAvailabilityIndicatorEvents(VideoAvailabilityIndicator event) {}

  virtual void GetVideoAvailabilityIndicatorEvents(std::vector<VideoAvailabilityIndicator>& events) {}

  virtual int setUserId(uid_t uid) { user_id_ = uid; return 0; }

  virtual uid_t getUserId() { return user_id_; }

  virtual int GetActiveStreamsCount() = 0;

  virtual int prepareNodes(const char* id = nullptr) = 0;

  virtual bool attach(const AttachInfo& info) = 0;
  virtual bool detach(const DetachInfo& info) = 0;
  virtual bool registerTrackObserver(std::shared_ptr<IVideoTrackObserver> observer) {
    return false;
  }
  virtual bool unregisterTrackObserver(IVideoTrackObserver* observer) {
    return false;
  }

  virtual bool getStatisticsEx(LocalVideoTrackStatsEx& statsEx) { return false; }
  virtual int32_t Width() const = 0;
  virtual int32_t Height() const = 0;
  virtual void getBillingVideoProfile(int32_t& w, int32_t& h, int32_t& frame_rate) {};
  virtual bool Enabled() const = 0;
  // TODO(Qingyou Pan): Need refine code to remove this interface.
  virtual int addVideoWatermark(const char* watermarkUrl, const WatermarkOptions& options) { return -ERR_NOT_SUPPORTED; }
  virtual int clearVideoWatermarks() { return -ERR_NOT_SUPPORTED; }

  // virtual int enableAndUpdateVideoWatermarks(WatermarkConfig* watermark_configs, int length, bool visible_in_preview) { return -ERR_NOT_SUPPORTED; }
  // virtual int disableVideoWatermarks() { return -ERR_NOT_SUPPORTED; }

  virtual InternalVideoSourceType getInternalVideoSourceType() { return InternalVideoSourceType::None; }

  virtual rtc::VideoEncoderConfiguration getVideoEncoderConfiguration() { return {}; }

  virtual bool getVideoTextureCopyStatus(VideoTextureCopyParam& param) { return false; }

  virtual void getSimucastStreamConfig(SimulcastConfigInternal& simu_stream_config) {}
  virtual void getSimucastStreamStatus(SIMULCAST_STREAM_MODE& mode, bool& enable) {}
  virtual void getBillingVideoProfileWithSimulcast(bool& enable, SimulcastConfigInternal& simu_config) {}

  virtual int updateContentHint(VIDEO_CONTENT_HINT contentHint) { return -ERR_NOT_SUPPORTED; }

  virtual int updateScreenCaptureScenario(SCREEN_SCENARIO_TYPE screenScenario) { return -ERR_NOT_SUPPORTED; }

  int TrackId() const { return id_; }

  virtual int registerVideoEncodedFrameObserverLLApiInternal(media::IVideoEncodedFrameObserver* videoReceiver) = 0;

  virtual int unregisterVideoEncodedFrameObserverLLApiInternal(media::IVideoEncodedFrameObserver* videoReceiver) = 0;

  virtual int setLocalVideoSend(bool send) = 0;

  virtual bool ClearPriorityDeviceVideoConfigs() { return false; }

  virtual int getCodecType() = 0;
  
  virtual void setVideoDumpMode(int mode, bool enabled, int frame_cnt = -1) {}

  virtual bool NegotiateCodec(uint8_t negotiated_video_decode_caps) { return false; }
                               
  virtual void onVideoModuleStatus(std::string node_name, int type) {}

  virtual int onRequestEnableSimulcastStream() { return 0; }

  virtual bool getIsAttachedToNetwork() { return false; }

  virtual bool isVideoFilterEnabled(const char* id) { return false; }

  virtual void ReconfigureFecMethod(int fec_method, int dmec_version, int fec_mul_rdc) {}

  virtual void ReconfigureCaptureDelayMs(int video_capture_delay_ms) {}

  virtual bool setEncoderTemporlayers(int temporlayersNum) { return false; }

  virtual bool setH264BframeNumber(int bframeNum)  { return false; }

  virtual bool enableMinorStreamPeriodicKeyFrame()  { return false; }

  virtual void registerProactiveCaller(const std::shared_ptr<rtc::ProactiveCaller>& configurator) { return; }
  virtual void unregisterProactiveCaller() { return; }

  virtual void registerModuleControlPanel(std::shared_ptr<rtc::IModuleControlPanel> panel) { return; }
  virtual void unregisterModuleControlPanel() { return; }

  virtual int setEnabledLLApiInternal(bool enable, bool action_droppable = true) = 0;
  virtual LOCAL_VIDEO_STREAM_STATE getStateLLApiInternal() = 0;
  virtual int setSimulcastStreamModeLLApiInternal(SIMULCAST_STREAM_MODE mode, const SimulcastConfigInternal& simu_config) = 0;
  virtual int setVideoEncoderConfigurationLLApiInternal(const rtc::VideoEncoderConfiguration& config) = 0;
  virtual bool addVideoFilterLLApiInternal(agora_refptr<IVideoFilter> filter, media::base::VIDEO_MODULE_POSITION position = media::base::POSITION_POST_CAPTURER,
      const char* id = NULL) = 0;
  virtual bool removeVideoFilterLLApiInternal(agora_refptr<IVideoFilter> filter, media::base::VIDEO_MODULE_POSITION position = media::base::POSITION_POST_CAPTURER,
      const char* id = NULL) = 0;
  virtual bool hasVideoFilterLLApiInternal(const char* id, media::base::VIDEO_MODULE_POSITION position) = 0;
  virtual bool addRendererLLApiInternal(agora_refptr<IVideoSinkBase> videoRenderer, media::base::VIDEO_MODULE_POSITION position) = 0;
  virtual bool removeRendererLLApiInternal(agora_refptr<IVideoSinkBase> videoRenderer, media::base::VIDEO_MODULE_POSITION position) = 0;
  virtual bool getStatisticsLLApiInternal(LocalVideoTrackStats& stats) = 0;
  virtual int enableVideoFilterLLApiInternal(const char* id, bool enable) {return -1;}
  virtual int setFilterPropertyLLApiInternal(const char* id, const char* key, const char* json_value) { return -1; };
  virtual int getFilterPropertyLLApiInternal(const char* id, const char* key, char* json_value, size_t buf_size) { return -1; };

 protected:
  const int id_;
  utils::WeakObserversFacility<IVideoTrackObserver> track_observers_;
  uid_t user_id_;

 private:
  static std::atomic<int> id_generator_;
};

struct RemoteVideoTrackStatsEx : RemoteVideoTrackStats {
  uint64_t firstDecodingTimeTickMs = 0;
  uint64_t firstVideoFrameRendered = 0;
  bool isHardwareCodec = false;
  int64_t totalFrozen200ms = 0;
  uint32_t last_frame_max = 0;
  uint32_t dec_in_num = 0;
  uint32_t render_in_num = 0;
  uint32_t render_out_num = 0;
  uint32_t fec_pkts_num = 0;
  uint32_t loss_af_fec = 0;
  int jitter_offset_ms = 0;
  int decode_level[10] = {0};
  uint64_t qp_sum = 0;
  VideoContentType content_type = VideoContentType::UNSPECIFIED;
  std::vector<VideoAvailabilityIndicator> video_availability;
};

class IRemoteVideoTrackEx : public IRemoteVideoTrack,
                            public VideoRemoteTrackControlAspect {
 public:
  enum DetachReason { MANUAL, TRACK_DESTROY, NETWORK_DESTROY };
  using RemoteVideoEvents = StateEvents<REMOTE_VIDEO_STATE, REMOTE_VIDEO_STATE_REASON>;

  struct AttachInfo {
    VideoNodeRtpSource* source;
    VideoNodeRtpSink* rtcp_sender;
    WeakPipelineBuilder builder;
    bool recv_media_packet = false;
    uint64_t stats_space = 0;
    bool enable_vpr = false;
    bool disable_rewrite_num_reorder_frame = false;
    std::shared_ptr<webrtc::IRsfecCodecFactoryInterface> rsfec_codec_factory;
    uint32_t video_threshhold_ms = 0;
    VideoQoEAnalyzerParameter qoe_analyzer_parameters;
    conn_id_t conn_id = 0;
  };

  struct DetachInfo {
    VideoNodeRtpSource* source;
    VideoNodeRtpSink* rtcp_sender;
    DetachReason reason;
  };

  IRemoteVideoTrackEx() = default;

  virtual ~IRemoteVideoTrackEx() {}

  virtual uint32_t getRemoteSsrc() = 0;

  virtual bool attach(const AttachInfo& info, REMOTE_VIDEO_STATE_REASON reason) = 0;
  virtual bool detach(const DetachInfo& info, REMOTE_VIDEO_STATE_REASON reason) = 0;

  virtual bool getStatisticsEx(RemoteVideoTrackStatsEx& statsex) { return false; }

  virtual bool registerTrackObserver(std::shared_ptr<IVideoTrackObserver> observer) {
    return false;
  }
  virtual bool unregisterTrackObserver(IVideoTrackObserver* observer) {
    return false;
  }
  virtual void registerProactiveCaller(const std::shared_ptr<ProactiveCaller>&) {}
  virtual void unregisterProactiveCaller() {}
  virtual REMOTE_VIDEO_STATE getStateLLApiInternal() = 0;
  virtual bool addVideoFilterLLApiInternal(agora_refptr<IVideoFilter> filter, media::base::VIDEO_MODULE_POSITION position = media::base::POSITION_POST_CAPTURER,
      const char* id = NULL) = 0;
  virtual bool removeVideoFilterLLApiInternal(agora_refptr<IVideoFilter> filter, media::base::VIDEO_MODULE_POSITION position = media::base::POSITION_POST_CAPTURER,
      const char* id = NULL) = 0;
  virtual bool hasVideoFilterLLApiInternal(const char* id, media::base::VIDEO_MODULE_POSITION position) = 0;
  virtual bool addRendererLLApiInternal(agora_refptr<IVideoSinkBase> videoRenderer, media::base::VIDEO_MODULE_POSITION position = media::base::POSITION_PRE_RENDERER) = 0;
  virtual bool removeRendererLLApiInternal(agora_refptr<IVideoSinkBase> videoRenderer, media::base::VIDEO_MODULE_POSITION position) = 0;
  virtual bool getStatisticsLLApiInternal(RemoteVideoTrackStats& stats) = 0;
  virtual bool getTrackInfoLLApiInternal(VideoTrackInfo& info) = 0;
  virtual int registerVideoEncodedFrameObserverLLApiInternal( agora::media::IVideoEncodedFrameObserver* encodedObserver) = 0;
  virtual int unregisterVideoEncodedFrameObserverLLApiInternal( agora::media::IVideoEncodedFrameObserver* encodedObserver) = 0;
  virtual int enableVideoFilterLLApiInternal(const char* id, bool enable){ return -1; };
  virtual int setFilterPropertyLLApiInternal(const char* id, const char* key, const char* json_value){ return -1; };
  virtual int registerMediaPacketReceiverLLApiInternal(IMediaPacketReceiver* packetReceiver) = 0;
  virtual int unregisterMediaPacketReceiverLLApiInternal(IMediaPacketReceiver* packetReceiver) = 0;
  virtual void OnRoleUpdate(CLIENT_ROLE_TYPE role) {};

 protected:
  utils::WeakObserversFacility<IVideoTrackObserver> track_observers_;
};

}  // namespace rtc
}  // namespace agora
