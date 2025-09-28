//
//  Agora RTC/MEDIA SDK
//
//  Created by Pengfei Han in 2019-11.
//  Copyright (c) 2019 Agora.io. All rights reserved.
//
#pragma once

#include <memory>
#include <functional>
#include "AgoraRefPtr.h"

#include "IAgoraMediaPlayerSource.h"
#include "NGIAgoraMediaNodeFactory.h"
#include "NGIAgoraMediaNode.h"



namespace agora {
namespace base {
class BaseWorker;
class IAgoraService;
}  // namespace base

namespace rtc {

class IMediaPlayerSourceEx : public IMediaPlayerSource {
 protected:
  virtual ~IMediaPlayerSourceEx() = default;

 public:
  static agora_refptr<IMediaPlayerSourceEx> Create(base::IAgoraService *agora_service,
                                                   media::base::MEDIA_PLAYER_SOURCE_TYPE type = media::base::MEDIA_PLAYER_SOURCE_DEFAULT);

  virtual agora_refptr<rtc::IAudioPcmDataSender> getAudioPcmDataSender() = 0;
  virtual agora_refptr<rtc::IVideoFrameSender> getVideoFrameSender() = 0;
  virtual void setRenderLastVideoFrame(bool set_black_frame) = 0;
  virtual bool showBlackFrameWhenStop() = 0;
  virtual int64_t getFirstAudioFramePts() = 0;
  virtual int64_t getFirstVideoFramePts() = 0;
  virtual int getPlayerOption(const char* key, int64_t& value) = 0;
  virtual int registerPlayerSourceObserverEx(IMediaPlayerSourceObserver* observer, bool internal) = 0;
  int registerPlayerSourceObserver(IMediaPlayerSourceObserver* observer) final {
    return registerPlayerSourceObserverEx(observer, false);
  }
  virtual void onPlayerSourceObserverCallback(std::function<void(IMediaPlayerSourceObserver*)>&& task) = 0;
};

}  // namespace rtc
}  // namespace agora
