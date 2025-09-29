//  Agora RTC/MEDIA SDK
//
//  Created by Pengfei Han in 2019-06.
//  Copyright (c) 2019 Agora.io. All rights reserved.
//
#pragma once

#include <cstdint>
#include <list>
#include <memory>
#include <string>
#include <vector>

#include "AgoraBase.h"
#include "audio_node_stat_i.h"

namespace agora {
namespace rtc {


static const uint8_t kVideoEngineFlagHasIntraRequest = 0x10;
static const uint8_t kVideoEngineFlagStdCodec = 0x8;
static const uint8_t kVideoEngineFlagNasa = 0x40;
static const uint8_t kVideoEngineFlagScalableDelta = 0x80;
static const uint8_t kVideoEngineFlagMajorStreamOnly = 0x01;

static const uint8_t kAgoraHeaderLength = 3;
static const uint8_t kAgoraAudioExtendLength = 5;

enum MEDIA_STREAM_TYPE {
  MEDIA_STREAM_TYPE_AUDIO = (1 << 0),
  MEDIA_STREAM_TYPE_VIDEO_LOW = (1 << 1),
  MEDIA_STREAM_TYPE_VIDEO_HIGH = (1 << 2),
  MEDIA_STREAM_TYPE_VIDEO_LAYER_0 = MEDIA_STREAM_TYPE_VIDEO_HIGH,
  MEDIA_STREAM_TYPE_VIDEO_LAYER_1 = (1 << 16),
  MEDIA_STREAM_TYPE_VIDEO_LAYER_2 = (1 << 17),
  MEDIA_STREAM_TYPE_VIDEO_LAYER_3 = (1 << 18),
  MEDIA_STREAM_TYPE_VIDEO_LAYER_4 = (1 << 19),
  MEDIA_STREAM_TYPE_VIDEO_LAYER_5 = (1 << 20),
  MEDIA_STREAM_TYPE_VIDEO_LAYER_6 = (1 << 21),
  MEDIA_STREAM_TYPE_VIDEO = (MEDIA_STREAM_TYPE_VIDEO_LOW | MEDIA_STREAM_TYPE_VIDEO_HIGH | MEDIA_STREAM_TYPE_VIDEO_LAYER_1 | MEDIA_STREAM_TYPE_VIDEO_LAYER_2
    | MEDIA_STREAM_TYPE_VIDEO_LAYER_3 | MEDIA_STREAM_TYPE_VIDEO_LAYER_4 | MEDIA_STREAM_TYPE_VIDEO_LAYER_5 | MEDIA_STREAM_TYPE_VIDEO_LAYER_6),
  MEDIA_STREAM_TYPE_MEDIA = MEDIA_STREAM_TYPE_AUDIO | MEDIA_STREAM_TYPE_VIDEO,
};

enum MEDIA_FRAMERATE_LEVEL {
  MEDIA_FRAMERATE_LEVEL_HIGH = (0b00 << 24),
  MEDIA_FRAMERATE_LEVEL_MIDDLE = (0b01 << 24),
  MEDIA_FRAMERATE_LEVEL_LOW = (0b10 << 24),
};

struct SMediaFrame {
  uid_t uid_;
  uint8_t flags_;
  uint16_t seq_;
  uint16_t ssrc_;
  uint64_t packetSentTs_;
  uint64_t sentTs_;
  uint64_t receiveTs_;
  std::string payload_;
  SMediaFrame() : uid_(0), flags_(0), seq_(0), ssrc_(0), sentTs_(0), receiveTs_(0) {}
};

struct SAudioFrame : public SMediaFrame {
  uint8_t codec_;
  uint32_t ts_;
  int8_t vad_;
  uint8_t internalFlags_;
  uint16_t audio_fec_level_;
  bool arq_to_rsfec_flag_;
  uint16_t cc_type_;
  // energy is only used for send
  uint8_t energy_;
  AudioFrameHandleInfo handle_info_;
  uint32_t bitrate_profile_kbps;
  int64_t audio_pts_;
  std::string metadata_;
  SAudioFrame() : SMediaFrame(), codec_(0), ts_(0), vad_(0), internalFlags_(0), audio_fec_level_(0), arq_to_rsfec_flag_(true), cc_type_(0), energy_(0), bitrate_profile_kbps(0), audio_pts_(0) {}
};

using SharedSAudioFrame = std::shared_ptr<SAudioFrame>;

struct SAudioPacket {
  enum AUDIO_PACKET_TYPE {
    AUDIO_PACKET_REXFERRED = 0x1,
    AUDIO_PACKET_FROM_VOS = 0x2,
    AUDIO_PACKET_FROM_P2P = 0x4,
  };
  int8_t vad_;
  uint8_t codec_;
  uint8_t internalFlags_;
  uint16_t seq_;
  uint16_t ssrc_;
  uint16_t payloadLength_;
  uint16_t latestFrameSeq_;
  bool filterable_;
  std::list<SharedSAudioFrame> frames_;
  AudioFrameHandleInfo handle_timing_;
  std::string metadata_;
  SAudioPacket()
      : vad_(0),
        codec_(0),
        internalFlags_(0),
        seq_(0),
        ssrc_(0),
        payloadLength_(0),
        latestFrameSeq_(0),
        filterable_(true) {}
};

struct rtc_packet_t {
  enum INTERNAL_FLAG_TYPE {
    RTC_FLAG_REXFERRED = 0x1,
    RTC_FLAG_FROM_VOS = 0x2,
    RTC_FLAG_FROM_P2P = 0x4,
    RTC_FLAG_FROM_BROADCAST = 0x8,
    VIDEO_FLAG_TIMESTAMP_SET = 0x10,
    VIDEO_FLAG_CACHED = 0x20,
    VIDEO_FLAG_VIDEO3 = 0x40,
  };
  uid_t uid;
  uint32_t seq;
  uint16_t payload_length;  // should be the same as payload.length()
  uint64_t sent_ts;
  uint64_t recv_ts;
  int link_id;
  uint8_t internal_flags;
  std::string payload;
  rtc_packet_t()
      : uid(0), seq(0), payload_length(0), sent_ts(0), recv_ts(0), link_id(-1), internal_flags(0) {}
  virtual ~rtc_packet_t() {}
};

struct broadcast_packet_t : public rtc_packet_t {
  bool quit;
  bool rtcp;
  bool need_reliable;
  bool real_quit;
  bool audience_send;
  broadcast_packet_t()
    : quit(false), rtcp(false), need_reliable(false), real_quit(false), audience_send(false) {}
};

struct distribution_property_t {
  uint32_t estimated_bandwith_of_receiver = 0;
  uint32_t queueing_time_to_receiver = 0;
  uint8_t max_sender_output_level = 0;
  uint32_t actual_sender_bandwidth = 0;
  uint8_t actual_sender_output_level = 0;
};

struct audio_packet_t : public rtc_packet_t {
  uint32_t ts;
  int8_t vad;
  uint8_t codec;
  int last_error;  // error code set by last filter
  uint32_t reqMs;  // for calculating RTT only
  uint8_t flags;   // flags from SAudioFrame
  int64_t audio_pts;  //audio pts from SAudioFrame extension
  std::string metadata_;
  audio_packet_t() : ts(0), vad(0), codec(0), last_error(0), reqMs(0), flags(0), audio_pts(0) {}
};

struct video_packet_t : public rtc_packet_t {
  enum VIDEO_STREAM_TYPE {
    VIDEO_STREAM_UNKNOWN = -1,
    VIDEO_STREAM_HIGH = 0,
    VIDEO_STREAM_LOW = 1,
    VIDEO_STREAM_MEDIUM = 2,
    VIDEO_STREAM_LIVE = 3,
    VIDEO_STREAM_LAYER_0 = VIDEO_STREAM_HIGH,
    VIDEO_STREAM_LAYER_1 = 4,
    VIDEO_STREAM_LAYER_2 = 5,
    VIDEO_STREAM_LAYER_3 = 6,
    VIDEO_STREAM_LAYER_4 = 7,
    VIDEO_STREAM_LAYER_5 = 8,
    VIDEO_STREAM_LAYER_6 = 9,
    VIDEO_STREAM_MIN = VIDEO_STREAM_HIGH,
    VIDEO_STREAM_MAX = VIDEO_STREAM_LAYER_6,
  };

  enum VIDEO_FLAG_TYPE {
    // below is for video2 only, not used in video3
    VIDEO_FLAG_KEY_FRAME = 0x80,
    VIDEO_FLAG_FEC = 0x40,
    VIDEO_FLAG_LIVE = 0x20,
    VIDEO_FLAG_STD_CODEC = 0x8,  // also for video3 to differentiate std stream and private stream
    VIDEO_FLAG_B_FRAME = 0x10,
    // below is for video3
    VIDEO_FLAG_HARDWARE_ENCODE = 0x4,
  };

  enum VIDEO_FRAME_TYPE {
    KEY_FRAME = 0,
    DELTA_FRAME = 1,
    B_FRAME = 2,
  };

  // TODO(Bob): This should be removed and use public API definitions.
  enum VIDEO_CODEC_TYPE {
    VIDEO_CODEC_VP8 = 1,   // std VP8
    VIDEO_CODEC_H264 = 2,  // std H264
    VIDEO_CODEC_EVP = 3,   // VP8 with BCM
    VIDEO_CODEC_E264 = 4,  // H264 with BCM
  };

  enum VIDEO_EXTRA_FLAG_TYPE {
    // marks if the |req_ms| field of PVideoRexferRes_v4 is set
    VIDEO_EXTRA_FLAG_TIMESTAMP_SET = 0x1,
  };

  enum EXTENSION_VERSION {
    EXTENSION_VERSION_0 = 0,
    EXTENSION_VERSION_1 = 1,
    EXTENSION_VERSION_2 = 2,
  };

  struct Extension {
    bool has_extension_ = false;
    uint16_t tag_ = EXTENSION_VERSION_0;
    std::vector<uint32_t> content_;
  };

  uint32_t frameSeq;
  uint8_t frameType;
  uint8_t streamType;
  uint16_t packets;
  uint16_t subseq;
  uint16_t fecPkgNum;
  uint8_t codec;
  uint8_t flags;
  uint8_t protocolVersion;
  uint32_t reqMs;  // for calculating RTT only
  uint32_t reserve1;
  Extension extension;
  int64_t transport_seq;  // for transport-cc
  int8_t cc_type;
  uint8_t max_temporal_layers;
  uint8_t curr_temporal_layer;
  uint32_t bitrate_profile_kbps;

  video_packet_t()
      : frameSeq(0),
        frameType(0),
        streamType(0),
        packets(0),
        subseq(0),
        fecPkgNum(0),
        codec(0),
        flags(0),
        protocolVersion(0),
        reqMs(0),
        reserve1(0),
        transport_seq(-1),
        cc_type(0),
        bitrate_profile_kbps(0) {}

  union video3_flags {
    struct {
      uint8_t stream_type : 4;
      uint8_t frame_type : 4;
    };
    uint8_t video_type;
  };

  void fromVideType(uint8_t f) {
    video3_flags t;
    t.video_type = f;
    streamType = t.stream_type;
    frameType = t.frame_type;
  }

  uint8_t toVideoType() const {
    video3_flags t;
    t.stream_type = streamType;
    t.frame_type = frameType;
    return t.video_type;
  }

  bool hasReserveBit(uint16_t bit) { return (reserve1 & (1u << bit)) == (1u << bit); }
};

struct control_broadcast_packet_t {
  rtc::uid_t uid = 0;
  bool from_vos = false;
  std::string payload;
};

struct video_custom_ctrl_broadcast_packet_t {
  rtc::uid_t uid;
  std::string payload;
};

struct peer_message_t {
  rtc::uid_t uid;
  int type;
  std::string user_id;
  std::string payload;
};

enum VideoStreamType {
  MASTER_VIDEO_STREAM = 0,
  LOW_BITRATE_VIDEO_STREAM = 1,
  MEDIUM_BITRATE_VIDEO_STREAM = 2,
  LIVE_VIDEO_STREAM = 3,
};

}  // namespace rtc
}  // namespace agora
