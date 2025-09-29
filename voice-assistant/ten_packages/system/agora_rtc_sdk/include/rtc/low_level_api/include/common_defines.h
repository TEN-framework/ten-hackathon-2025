//
//  Agora RTC/MEDIA SDK
//
//  Created by Letao Zhang in 2019-08.
//  Copyright (c) 2019 Agora.io. All rights reserved.
//
#pragma once

#include <memory>
#include <api/cpp/aosl_ares_class.h>

#define ARES_COMPLETE_IF_NEEDED(ares, ret)  do {                                     \
                                                if (!aosl_ref_invalid(ares)) {       \
                                                    aosl_ares_complete(ares, ret);   \
                                                }                                    \
                                            } while (0);
                                            
namespace webrtc {
class Call;
}  // namespace webrtc

namespace agora {
namespace rtc {

using PipelineBuilder = std::shared_ptr<webrtc::Call>;
using WeakPipelineBuilder = std::weak_ptr<webrtc::Call>;

}  // namespace rtc
}  // namespace agora
