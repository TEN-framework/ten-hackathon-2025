//
//  Agora RTC/MEDIA SDK
//
//  Created by Ning Huang in 2022-06.
//  Copyright (c) 2022 Agora.io. All rights reserved.
//
#pragma once  // NOLINT(build/header_guard)

#include "AgoraRefPtr.h"
#include "AgoraMediaBase.h"

namespace agora {
namespace rtc {
// I420

class ContentInspectExtension : public RefCountInterface {
public:
 virtual ~ContentInspectExtension() {};

 virtual bool Init() = 0;
 virtual bool Process(media::base::VideoFrame &image, float score[3]) = 0;
};

}  // namespace rtc
}  // namespace agora