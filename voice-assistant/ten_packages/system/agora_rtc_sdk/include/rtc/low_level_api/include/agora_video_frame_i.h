//
//  Agora SDK
//
//  Copyright (c) 2021 Agora.io. All rights reserved.
//

#pragma once

#include "NGIAgoraVideoFrame.h"
#include "webrtc/api/video/video_frame_buffer.h"
#include "webrtc/api/video/video_rotation.h"

namespace agora {
namespace rtc {

class IVideoFrameEx : public IVideoFrame {
 public:
  virtual ::rtc::scoped_refptr<webrtc::VideoFrameBuffer> video_frame_buffer() = 0;
  virtual uint32_t timestamp() const = 0;
  virtual int64_t render_time_ms() const = 0;
  virtual webrtc::VideoRotation rotation() const = 0;
};

class IVideoFrameMemoryPoolEx : public IVideoFrameMemoryPool {
 public:
  using IVideoFrameMemoryPool::createVideoFrame;
  virtual agora::agora_refptr<IVideoFrame> createVideoFrame(
      const ::rtc::scoped_refptr<webrtc::VideoFrameBuffer>& internal_buffer,
      int64_t timestamp,
      int64_t ntp_timestamp,
      webrtc::VideoRotation rotation) = 0;
};

}  // namespace rtc
}  // namespace agora
