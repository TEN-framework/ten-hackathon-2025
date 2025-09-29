//
//  Agora SDK
//
//  Copyright (c) 2021 Agora.io. All rights reserved.
//

#pragma once

#include "NGIAgoraExtensionProvider.h"
#include "AgoraExtensionVersion.h"
#include <api/aosl_mpq.h>
#include <api/cpp/aosl_ref_class.h>

namespace webrtc {
class VideoEncoder;
class VideoDecoder;
}  // namespace webrtc

namespace agora {
namespace rtc {

static const int MAX_ENCODER_NUM_PER_PROVIDER = 5;
static const int MAX_DECODER_NUM_PER_PROVIDER = 5;

// string literals for codec property keys
static const char* const PROP_KEY_CODEC_SDP_FORMAT_JSON = "video_sdp_format_json";

struct VideoCodecInfo {
  const char* codec_name = nullptr;
  const char* impl_type = nullptr;
  bool is_hw_accelerated = false;
};

static const int32_t MAX_JSON_LEN = 1000;
struct VideoSdpFormatJson {
  char json_str[MAX_JSON_LEN];
  int32_t str_len = 0;
};

class IVideoEncoderProvider : public IExtensionProvider {
 public:
  virtual ~IVideoEncoderProvider() {}
  virtual int enumerateEncoders(VideoCodecInfo* info_list, int& count) = 0;
  virtual webrtc::VideoEncoder* createEncoder(const VideoCodecInfo& info, aosl_mpq_t mpq = AOSL_MPQ_INVALID) = 0;
  virtual int destroyEncoder(webrtc::VideoEncoder* encoder) = 0;
  virtual int getCustomProperty(const VideoCodecInfo& info,
                                const char* key, void* data) {
    return -1;
  }
  virtual int setCustomProperty(const VideoCodecInfo& info,
                                const char* key, const void* data) {
    return -1;
  }
};

class IVideoDecoderProvider : public IExtensionProvider {
 public:
  virtual ~IVideoDecoderProvider() {}
  virtual int enumerateDecoders(VideoCodecInfo* info_list, int& count) = 0;
  virtual webrtc::VideoDecoder* createDecoder(const VideoCodecInfo& info, aosl_mpq_t mpq) = 0;
  virtual int destroyDecoder(webrtc::VideoDecoder* decoder) = 0;
  virtual int getCustomProperty(const VideoCodecInfo& info,
                                const char* key, void* data) {
    return -1;
  }
  virtual int setCustomProperty(const VideoCodecInfo& info,
                                const char* key, const void* data) {
    return -1;
  }
};

#define RESERVED_ENCODER_PROVIDER_MAJOR_VERSION 10000
template <>
struct ExtensionInterfaceVersion<IVideoEncoderProvider> {
  static ExtensionVersion Version() {
    return ExtensionVersion(RESERVED_ENCODER_PROVIDER_MAJOR_VERSION, 0, 0);
  }
};

#define RESERVED_DECODER_PROVIDER_MAJOR_VERSION 20000
template <>
struct ExtensionInterfaceVersion<IVideoDecoderProvider> {
  static ExtensionVersion Version() {
    return ExtensionVersion(RESERVED_DECODER_PROVIDER_MAJOR_VERSION, 0, 0);
  }
};

}  // namespace rtc
}  // namespace agora
