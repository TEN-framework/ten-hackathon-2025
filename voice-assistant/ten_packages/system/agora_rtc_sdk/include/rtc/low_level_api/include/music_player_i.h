#pragma once
#include "IAgoraMusicContentCenter.h"

namespace agora {
namespace rtc {

class IMusicPlayerEx : public IMusicPlayer {
 public:
  virtual agora_refptr<ILocalAudioTrack> getLocalAudioTrack() = 0;

  virtual agora_refptr<ILocalVideoTrack> getLocalVideoTrack() = 0;

};

}  // namespace rtc
}  // namespace agora