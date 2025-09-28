//
//  Agora Media SDK
//
//  Created by Sting Feng in 2015-05.
//  Copyright (c) 2015 Agora IO. All rights reserved.
//
#pragma once

#include <memory>
#include <string>
#include <vector>

#include "AgoraMediaBase.h"
#include "AgoraRefPtr.h"

#include "NGIAgoraCameraCapturer.h"
#include "NGIAgoraVideoMixerSource.h"
#include "NGIAgoraMediaNodeFactory.h"
#include "NGIAgoraMediaNode.h"
#include "api/video/video_frame.h"
#include "main/core/video/stats_and_events/video_stats_events_pusher.h"
#include "facilities/miscellaneous/view_manager.h"

namespace webrtc {
class VideoFrame;
}  // namespace webrtc

namespace rtc {
struct VideoSinkWants;

template <typename VideoFrameT>
class VideoSinkInterface;
}  // namespace rtc

namespace agora {
namespace rtc {
struct RenderFreezeStats;

enum InternalRendererType {
  RENDERER_NONE = -1,
  RENDERER_BUILT_IN_RENDERER = 0,
  RENDERER_EXT_OBSERVER = 3,
};

struct PreviewMetaInfo {
  agora::rtc::view_shared_ptr_t view;
  bool mirror;
  bool vsync_mode;
  media::base::RENDER_MODE_TYPE render_mode;
};

struct FrameProcessResult {
  webrtc::VideoFrame outputFrame;
  bool dropFrame;
  FrameProcessResult(const webrtc::VideoFrame& frame, bool drop) : outputFrame(frame), dropFrame(drop) {}
};

struct VideoDataPipeFormat {
  VideoFormat format;
  bool fixed = false;

  VideoDataPipeFormat() = default;
  VideoDataPipeFormat(const VideoFormat& f, bool fi) : format(f), fixed(fi) {}

  bool operator==(const VideoDataPipeFormat& fmt) const {
    return format == fmt.format && fixed == fmt.fixed;
  }
  bool operator!=(const VideoDataPipeFormat& fmt) const {
    return !operator==(fmt);
  }
};

static const char* const BUILT_IN_SOURCE_FILTER = "built-in-source-filter";
static const char* const BUILT_IN_METADATA_OBSERVER = "built-in-metadata-observer";
static const char* const BUILT_IN_ADAPTER = "built-in-adapter";
static const char* const BUILT_IN_PRE_ENCODER_WATERMARK_FILTER = "built-in-pre-encoder-watermarker";
static const char* const BUILT_IN_POST_CAPTURER_WATERMARK_FILTER = "built-in-post-capturer-watermarker";

static const char* const BUILT_IN_PRE_ENCODER_FACEDETECE_FILTER = "built-in-pre-encoder-facedetect";

static const char* const BUILT_IN_SOURCE_TEE = "built-in-source-tee";
static const char* const BUILT_IN_PREVIEW_TEE = "built-in-preview-tee";
static const char* const BUILT_IN_MAJOR_TEE = "built-in-major-tee";
static const char* const BUILT_IN_SIMULCAST_TEE = "built-in-simulcast-tee";
static const char* const BUILT_IN_MINOR_ADAPTER = "built-in-minor-adapter";
static const char* const BUILT_IN_POST_CAPTURER_FILTER_OBSERVER = "built-in-post-capturer-filter-observer";
static const char* const BUILT_IN_PRE_ENCODER_FILTER_OBSERVER = "built-in-pre-encoder-filter-observer";
static const char* const BUILT_IN_POST_CAPTURER_FILTER_FRAME_OBSERVER = "CaptureFilterModeObserver";
static const char* const BUILT_IN_PRE_ENCODER_FILTER_FRAME_OBSERVER = "PreEncoderFilterModeObserver";
static const char* const BUILT_IN_STITCH_FRAME = "built-in-stitch-frame";

/** Filter definition for internal pipeline usage.
 */
class IVideoFilterEx : public IVideoFilter {
 public:
  // Internal node can use webrtc video frame directly to reduce copy operation.
  virtual void adaptVideoFrameAsync(const webrtc::VideoFrame& inputFrame,
    std::shared_ptr<FrameProcessResult> resultSp) = 0;

  // TODO(Bob): This should be moved to node base.
  virtual void onSinkWantsChanged(const ::rtc::VideoSinkWants& wants) = 0;
  bool isExternal() override { return false; }
  virtual void attachStatsSpace(uint64_t stats_space) {}
  virtual void setVideoQoEPusher(std::weak_ptr<VideoStatsEventsPusher> pusher) {}
  virtual void onDropFrame(agora::rtc::VideoQoEDropType drop_type) {}
  virtual void SetFilterId(std::string id) {}

 protected:
  ~IVideoFilterEx() {}
};

/** Video frame adapter.
 */
class IVideoFrameAdapter : public IVideoFilterEx {
 public:
  // Requests the output frame size and frame interval from
  // |AdaptFrameResolution| to not be larger than |format|. Also, the input
  // frame size will be cropped to match the requested aspect ratio. When "fixed"
  // is set false, the requested aspect ratio is orientation agnostic
  // and will be adjusted to maintain the input orientation, so it doesn't matter
  // if e.g. 1280x720 or 720x1280 is requested. Otherwise, the output format is
  // fixed. The input frame may be cropped and rotated to meet the output format.
  virtual void setOutputFormat(const VideoFormat& format, bool fixed = false) = 0;

  virtual void setOutputFormat(const VideoDataPipeFormat& format, agora::Optional<VideoDataPipeFormat>& source_pipe_format_expected) {
    setOutputFormat(format.format, format.fixed);
  };

  // Request the output frame in a fixed rotation.
  virtual void setOutputRotation(webrtc::VideoRotation rotation) {}

  // mirror the frame
  virtual void setMirror(bool mirror) {}

 protected:
  ~IVideoFrameAdapter() {}
};

enum CAMERA_OUTPUT_DATA_TYPE {
    CAMERA_OUTPUT_RAW = 0,              // YUV
    CAMERA_OUTPUT_TEXTURE = 1,          // Texture
    CAMERA_OUTPUT_TEXTURE_AND_RAW = 2,  // YUV && Texture
};

class ICameraCapturerEx : public ICameraCapturer {
 public:
  virtual ~ICameraCapturerEx() {}

#if defined(__ANDROID__) || (defined(TARGET_OS_IPHONE) && TARGET_OS_IPHONE)
  virtual void setPreviewInfo(const PreviewMetaInfo& info) {}
  virtual int setCameraSourceLLApiInternal(ICameraCapturer::CAMERA_SOURCE source) = 0;
  virtual bool isZoomSupportedLLApiInternal() = 0;
  virtual int32_t setCameraZoomLLApiInternal(float zoomValue) = 0;
  virtual float getCameraMaxZoomLLApiInternal() = 0;
  virtual bool isFocusSupportedLLApiInternal() = 0;
  virtual int32_t setCameraFocusLLApiInternal(float x, float y) = 0;
  virtual bool isAutoFaceFocusSupportedLLApiInternal() = 0;
  virtual int32_t setCameraAutoFaceFocusLLApiInternal(bool enable) = 0;
  virtual int32_t enableFaceDetectionLLApiInternal(bool enable) = 0;
  virtual bool isCameraFaceDetectSupportedLLApiInternal() = 0;
  virtual bool isCameraTorchSupportedLLApiInternal() = 0;
  virtual int32_t setCameraTorchOnLLApiInternal(bool isOn) = 0;
  virtual bool isCameraExposurePositionSupportedLLApiInternal() = 0;
  virtual int setCameraExposurePositionLLApiInternal(float positionXinView, float positionYinView) = 0;
  virtual bool isCameraExposureSupportedLLApiInternal() = 0;
  virtual int setCameraExposureFactorLLApiInternal(float factor) = 0;
  virtual int switchCameraLLApiInternal() = 0;
#elif defined(_WIN32) ||  (defined(TARGET_OS_IPHONE) && !(TARGET_OS_IPHONE) && (TARGET_OS_MAC)) || \
    (defined(__linux__) && !defined(__ANDROID__))
  virtual int initWithDeviceIdLLApiInternal(const char* deviceId) = 0;
  virtual int initWithDeviceNameLLApiInternal(const char* deviceName) = 0;
#endif

  virtual int setDeviceOrientationLLApiInternal(VIDEO_ORIENTATION orientation) = 0;
  virtual int setCaptureFormatLLApiInternal(const VideoFormat& capture_format) = 0;
  virtual VideoFormat getCaptureFormatLLApiInternal() = 0;
  virtual int registerCameraObserverLLApiInternal(ICameraCaptureObserver* observer) = 0;
  virtual int unregisterCameraObserverLLApiInternal(ICameraCaptureObserver* observer) = 0;

#if defined(__ANDROID__)
  virtual void setCameraOutputDataType(CAMERA_OUTPUT_DATA_TYPE type) = 0;
  virtual CAMERA_OUTPUT_DATA_TYPE getCameraOutputDataType() = 0;
  virtual void setCameraSelected(int module_selected) = 0;
  virtual void setCameraSelectedLevel(int camera_selected_level) = 0;
  virtual void setCameraPqFirst(bool pq_first) = 0;
  virtual void setCameraSkipControl(int skip_control) = 0;
  virtual void setVideoStabilityMode(int mode) = 0;
  virtual void setCameraLowPower(bool lowPower) = 0;
  virtual void setAutoFaceDetectFocus(bool enable) = 0;
  virtual void setCameraTemplateType(int type) = 0;
  virtual void setCameraTemplateVideoLowestScore(int lowestScore) = 0;
  virtual void setCameraExtraSurface(bool extraSurface) = 0;
  virtual void setCameraAutoWhiteBalance(bool enable) = 0;
  virtual void setVideoEdgeMode(int mode) = 0;
  virtual void setCamera1FocusMode(int mode) = 0;
  virtual void setCamera2FocusMode(int mode) = 0;
  virtual void setCamera1FpsRangeEnabled(bool enable) = 0;
  virtual void setCameraRefocusEnabled(bool enable) = 0;
  virtual int32_t setNoiseReductionMode(int mode) = 0;
  virtual int setCameraSourceWithCameraId(CAMERA_SOURCE source,const char* camera_id) = 0;
  virtual void switchCameraIdLLApiInternal(const char* cameraId) = 0;
  virtual void setFocalLengthType(CAMERA_FOCAL_LENGTH_TYPE focalLengthType) = 0;
#endif

#if defined(TARGET_OS_IPHONE) && TARGET_OS_IPHONE
  virtual bool enableMultiCameraLLApiInternal(bool enable) = 0;
  virtual bool isCameraAutoExposureFaceModeSupportedLLApiInternal() = 0;
  virtual int setCameraAutoExposureFaceModeEnabledLLApiInternal(bool enabled) = 0;
#endif

#if defined(WEBRTC_IOS)
  virtual void setCameraDropCount(int dropcount) = 0;
  virtual void setHDRCaptureEnable(bool enableHDRCapture) = 0;
  virtual void setCameraMirror(VIDEO_MIRROR_MODE_TYPE mirror) = 0;
#endif
  virtual void setColorSpaceInfo(webrtc::ColorSpace colorSpace) = 0;

#if defined(_WIN32) || (defined(__linux__) && !defined(__ANDROID__)) || \
    (defined(__APPLE__) && TARGET_OS_MAC && !TARGET_OS_IPHONE)
  virtual std::string getDeviceId() = 0;
#endif
  // Requests the output frame size and frame rate.
  // The output frame size will be cropped to match the requested aspect
  // ratio, unless |bypass_resolution_adaption| is set true in which case
  // no cropping is done. The output frame rate will not be larger than the
  // requested value. 
  // When "fixed" is set false, the requested aspect ratio is orientation
  // agnostic, so it doesn't matter if e.g. 1280x720 or 720x1280 is requested. 
  // Otherwise, the aspect ratio of output frame is fixed.
  virtual void setOutputFormat(const VideoDataPipeFormat& output_format, bool bypass_resolution_adaption = false) = 0;
};

class IVideoRendererEx : public IVideoRenderer {
 public:
  struct ViewOption {
    Rectangle cropArea = {0, 0, 0, 0};
    uid_t cropAreaUid = 0;
    bool enableAlphaMask = false;
    uint32_t backgroundColor = 0;
  };

  using IVideoRenderer::onFrame;
  virtual int onFrame(const webrtc::VideoFrame& videoFrame) {
    (void)videoFrame;
    return -ERR_NOT_SUPPORTED;
  }

  int setView(void* view, aosl_ref_t ares = AOSL_REF_INVALID) override {
    (void) view;
    return -ERR_NOT_SUPPORTED;
  }

  int addView(void* view, const Rectangle& cropArea, aosl_ref_t ares = AOSL_REF_INVALID) override {
    (void) view;
    (void) cropArea;
    return -ERR_NOT_SUPPORTED;
  }

  int removeView(void* view) override {
    (void) view;
    return -ERR_NOT_SUPPORTED;
  }

  virtual int addViewEx(agora::rtc::view_shared_ptr_t view, const ViewOption& option) {
    (void) option;
    return -ERR_NOT_SUPPORTED;
  }

  virtual int addViewEx(agora::rtc::view_shared_ptr_t view) {
    (void) view;
    return -ERR_NOT_SUPPORTED;
  }

  virtual int removeViewEx(agora::view_t view) {
    (void) view;
    return unsetView();
  }

  int setRenderMode(void* view, media::base::RENDER_MODE_TYPE renderMode, aosl_ref_t ares = AOSL_REF_INVALID) override {
    (void) view;
    (void) renderMode;
    return -ERR_NOT_SUPPORTED;
  }

  int setMirror(void* view, bool mirror, aosl_ref_t ares = AOSL_REF_INVALID) override {
    (void) view;
    (void) mirror;
    return -ERR_NOT_SUPPORTED;
  }

  using IVideoRenderer::setRenderMode;
  virtual int setRenderModeEx(agora::view_t view, media::base::RENDER_MODE_TYPE renderMode, aosl_ref_t ares = AOSL_REF_INVALID) {
    (void) view;
    return setRenderMode(renderMode, ares);
  }

  using IVideoRenderer::setMirror;
  virtual int setMirrorEx(agora::view_t view, bool mirror, aosl_ref_t ares = AOSL_REF_INVALID) {
    (void) view;
    return setMirror(mirror, ares);
  }

  virtual int setCropAreaEx(agora::view_t view, const Rectangle& cropArea, aosl_ref_t ares = AOSL_REF_INVALID) {
    (void) view;
    (void) cropArea;
    return -ERR_NOT_SUPPORTED;
  }

  virtual void attachUserInfo(uid_t uid, uint64_t state_space) {
    (void) uid;
    (void) state_space;
  }

  virtual void SetVideoQoEPusher(std::weak_ptr<agora::rtc::VideoStatsEventsPusher> pusher) {
    (void) pusher;
  }
    
  virtual int getViewMetaInfo(PreviewMetaInfo& info) {
    (void) info;
    return -ERR_NOT_SUPPORTED;
  }

  virtual int getViewMetaInfo(agora::view_t view, PreviewMetaInfo& info) {
    (void) view;
    (void) info;
    return -ERR_NOT_SUPPORTED;
  }

  virtual int getViewCount() {
    return -ERR_NOT_SUPPORTED;
  }

  virtual int clearBuffer() {
    return -ERR_NOT_SUPPORTED;
  }
  virtual int setRenderModeLLApiInternal(media::base::RENDER_MODE_TYPE renderMode) {return -ERR_NOT_SUPPORTED;}
  virtual int setRenderModeLLApiInternal(void* view, media::base::RENDER_MODE_TYPE renderMode) {return -ERR_NOT_SUPPORTED;}
  virtual int setRenderModeExLLApiInternal(view_t view, media::base::RENDER_MODE_TYPE renderMode) {return -ERR_NOT_SUPPORTED;}
  virtual int setMirrorLLApiInternal(bool mirror) {return -ERR_NOT_SUPPORTED;}
  virtual int setMirrorLLApiInternal(void* view, bool mirror) {return -ERR_NOT_SUPPORTED;}
  virtual int setMirrorExLLApiInternal(view_t view, bool mirror) {return -ERR_NOT_SUPPORTED;}
  virtual int setCropAreaExLLApiInternal(view_t view, const Rectangle& cropArea) {return -ERR_NOT_SUPPORTED;}
  virtual int setViewLLApiInternal(view_t view) {return -ERR_NOT_SUPPORTED;}
  virtual int addViewLLApiInternal(view_t view, const Rectangle& cropArea) {return -ERR_NOT_SUPPORTED;}
  virtual int unsetViewLLApiInternal() {return -ERR_NOT_SUPPORTED;}
  virtual int removeViewLLApiInternal(view_t view) {return -ERR_NOT_SUPPORTED;}
};

class IObservableVideoSink : public IVideoRendererEx {
 public:
  virtual void setVideoFrameObserver(agora::media::IVideoFrameObserver* observer) {}

 protected:
  ~IObservableVideoSink() {}
};

class IObservableVideoFilter : public IVideoFilterEx {
 public:
  virtual void setVideoFrameObserver(agora::media::IVideoFrameObserver* observer) {}

 protected:
  ~IObservableVideoFilter() {}
};

struct VideoEncodedImageData : public RefCountInterface {
  std::string image;
  VIDEO_FRAME_TYPE frameType;
  int width;
  int height;
  int framesPerSecond;
  // int64_t renderTimeInMs;
  VIDEO_ORIENTATION rotation;
  VIDEO_CODEC_TYPE codec;
  VIDEO_STREAM_TYPE streamType;
  int64_t captureTimeMs;
  int64_t decodeTimeMs;
  int64_t internalUplinkCostTimeStartMs;
  int64_t ptsMs;
};

struct CameraCharacteristicProfile {
  int deviceId;
  bool isTexture;
  bool textureCopy;
  bool pqFirst;
  int templateType;
  int noiseReduce;
  bool faceFocusing;
  bool whiteBalance;
  bool lowLevelCamera;
  std::string hardwareLevel;
  bool inited;
};

struct VideoHWCodecSpec {
  std::string codecName;
  std::string GPUVersion;
  std::string EncodeCapacity;
  std::string DecodeCapacity;
  int32_t codecType = 0;
  int32_t codecNum = 0;
  int32_t platformid = 0;
  std::string maxResolution;
  std::string deviceid;
  int32_t EncodeMaxLevel = 0;
  int32_t inputType = 0;
  int32_t bitrateMode = 0;
  int32_t profile = 0;
  int32_t minSupportedBitrate = 0;
  bool inited = false;
};

struct CameraInfo {
  bool inUse;
  std::string deviceName;
  std::string deviceId;
  std::string deviceType;
};
using CameraInfoList = std::vector<CameraInfo>;

class IVideoEncodedImageCallback {
 public:
  virtual ~IVideoEncodedImageCallback() {}
  virtual void OnVideoEncodedImage(agora_refptr<VideoEncodedImageData> data) = 0;
};

class IVideoEncodedImageSenderEx : public IVideoEncodedImageSender {
 public:
  virtual ~IVideoEncodedImageSenderEx() {}
  virtual void RegisterEncodedImageCallback(IVideoEncodedImageCallback* dataCallback,
                                            VIDEO_STREAM_TYPE stream_type) = 0;
  virtual void DeRegisterEncodedImageCallback(IVideoEncodedImageCallback* dataCallback,
                                              VIDEO_STREAM_TYPE stream_type) = 0;
  virtual void AttachStatSpace(uint64_t stats_space) = 0;
  virtual void DetachStatSpace(uint64_t stats_space) = 0;
  virtual bool sendEncodedVideoImageLLApiInternal(const uint8_t* imageBuffer, size_t length,
   const EncodedVideoFrameInfo& videoEncodedFrameInfo) = 0;

  virtual int getWidth() const = 0;
  virtual int getHeight() const = 0;
  virtual int getFps() const = 0;

};

class IVideoFrameSenderEx : public IVideoFrameSender {
 public:
  using IVideoFrameSender::sendVideoFrame;

  virtual ~IVideoFrameSenderEx() {}

  virtual int sendVideoFrame(const webrtc::VideoFrame& videoFrame) = 0;

  virtual void RegisterVideoFrameCallback(
      ::rtc::VideoSinkInterface<webrtc::VideoFrame>* dataCallback) = 0;
  virtual void DeRegisterVideoFrameCallback() = 0;
  virtual int sendVideoFrameLLApiInternal(const media::base::ExternalVideoFrame& videoFrame, aosl_ref_t ares = AOSL_REF_INVALID) = 0;
  virtual int getVideoFrame(webrtc::VideoFrame& videoFrame) = 0;
  virtual bool pushMode() = 0;
};

class IVideoMixerSourceEx : public IVideoMixerSource {
 public:
  virtual ~IVideoMixerSourceEx() = default;
  virtual void registerMixedFrameCallback(
        ::rtc::VideoSinkInterface<webrtc::VideoFrame>* dataCallback) = 0;
  virtual void deRegisterMixedFrameCallback(::rtc::VideoSinkInterface<webrtc::VideoFrame>* dataCallback) = 0;
  virtual void onFrame(const std::string& uid, const webrtc::VideoFrame& frame) = 0;
  virtual void startMixing() = 0;
  virtual void stopMixing() = 0;
  virtual bool hasVideoTrack(const std::string& id) = 0;
  virtual int addVideoTrackLLApiInternal(const char* id, agora_refptr<IVideoTrack> track) = 0;
  virtual int removeVideoTrackLLApiInternal(const char* id, agora_refptr<IVideoTrack> track) = 0;
  virtual int setStreamLayoutLLApiInternal(const char* id, const MixerLayoutConfig& config, std::shared_ptr<int> result) = 0;
  virtual int addImageSourceLLApiInternal(const char* id, const MixerLayoutConfig& config, ImageType type, std::shared_ptr<int> result) = 0;
  virtual int delImageSourceLLApiInternal(const char* id) = 0;
  virtual int delStreamLayoutLLApiInternal(const char* id) = 0;
  virtual int clearLayoutLLApiInternal() = 0;
  virtual int refreshLLApiInternal() = 0;
  virtual int setBackgroundLLApiInternal(uint32_t width, uint32_t height, int fps, uint32_t color_rgba = 0) = 0;
  virtual int setBackgroundLLApiInternal(uint32_t width, uint32_t height, int fps, const char* url) = 0;
  virtual int setRotationLLApiInternal(uint8_t rotation) = 0;
  virtual int getAvgMixerDelayLLApiInternal() = 0;
  virtual int setMasterClockSourceLLApiInternal(const char* id = NULL) = 0;
};

class IVideoFrameTransceiverEx : public IVideoFrameTransceiver {
 public:
  virtual int onFrame(const webrtc::VideoFrame& videoFrame) = 0;
  virtual void registerFrameCallback(
      ::rtc::VideoSinkInterface<webrtc::VideoFrame>* dataCallback) = 0;
  virtual void deRegisterFrameCallback(::rtc::VideoSinkInterface<webrtc::VideoFrame>* dataCallback) = 0;
  virtual void observeTxDelay(ILocalVideoTrack* track) = 0;
  virtual int addVideoTrackLLApiInternal(agora_refptr<IVideoTrack> track) = 0;

  virtual int removeVideoTrackLLApiInternal(agora_refptr<IVideoTrack> track) = 0;
};

static const char* const GLFW_RESOURCE = "glfw_resource";
struct GlobalResourceMetaInfo {
  const char* resource_name = nullptr;
  int (*init_func)(void*) = nullptr;
  int (*deinit_func)(void*) = nullptr;
  void* context = nullptr;
  bool fixed_thread = true;
  bool init_once = false;
};

class IExtensionVideoFilterControlEx : public IExtensionVideoFilter::Control {
 public:
  virtual ~IExtensionVideoFilterControlEx() = default;
  virtual int ReportCounter(int32_t counter_id, int32_t value) = 0;
  virtual int ReportEvent(int32_t event_id, void* event) = 0;
  virtual int DeclareGlobalResource(const GlobalResourceMetaInfo& meta_info, int& resource_count) = 0;
  virtual int ReleaseGlobalResource(const GlobalResourceMetaInfo& meta_info, int& resource_count) = 0;
  virtual void NotifySrDelay(int sr_delay_ms) = 0;
};

}  // namespace rtc
}  // namespace agora
