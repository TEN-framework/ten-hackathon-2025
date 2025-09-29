//
//  Agora Media SDK
//
//  Created by Sting Feng in 2015-05.
//  Copyright (c) 2015 Agora IO. All rights reserved.
//
#pragma once

namespace agora {
namespace rtc {

struct ScreenCaptureMetaInfo {
  bool is_crop = false;
  int crop_x = 0;
  int crop_y = 0;
  int crop_width = 0;
  int crop_height = 0;
  float update_ratio = 1.0f;
  int cursor_x = 0;
  int cursor_y = 0;
  int rotation = 0;
};

}  // namespace rtc
}  // namespace agora
