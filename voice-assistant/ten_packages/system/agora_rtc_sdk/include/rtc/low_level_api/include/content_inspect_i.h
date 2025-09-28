//
//  Agora RTC/MEDIA SDK
//
//  Created by Ning Huang in 2022-06.
//  Copyright (c) 2022 Agora.io. All rights reserved.
//
#pragma once

#include <string>
#include <vector>

#include "AgoraMediaBase.h"

namespace agora {
namespace media {
enum CONTENT_INSPECT_VENDOR { CONTENT_INSPECT_VENDOR_AGORA = 1, CONTENT_INSPECT_VENDOR_TUPU = 2, CONTENT_INSPECT_VENDOR_HIVE = 3 };
enum CONTENT_INSPECT_DEVICE_TYPE{
    CONTENT_INSPECT_DEVICE_INVALID = 0,
    CONTENT_INSPECT_DEVICE_AGORA = 1
};
enum CONTENT_INSPECT_WORK_TYPE {
/**
 * video moderation on device
 */
CONTENT_INSPECT_WORK_DEVICE = 0,
/**
 * video moderation on cloud
 */
CONTENT_INSPECT_WORK_CLOUD = 1,
/**
 * video moderation on cloud and device
 */
CONTENT_INSPECT_WORK_DEVICE_CLOUD = 2
};
enum CONTENT_INSPECT_CLOUD_TYPE{
    CONTENT_INSPECT_CLOUD_INVALID = 0,
    CONTENT_INSPECT_CLOUD_AGORA = 1,
    CONTENT_INSPECT_CLOUD_MARKET_PLACE = 2,
};

struct ContentInspectModuleEx : ContentInspectModule {
  /**
   * The content inspect module type.
   */
  CONTENT_INSPECT_TYPE type;
  CONTENT_INSPECT_VENDOR vendor;
  std::string callbackUrl;
  std::string token;
  /**The content inspect frequency, default is 0 second.
   * the frequency <= 0 is invalid.
   */
  unsigned int interval;
  ContentInspectModuleEx() {
    type = CONTENT_INSPECT_INVALID;
    interval = 0;
    vendor = CONTENT_INSPECT_VENDOR_AGORA;
  }
};

/** Definition of ContentInspectConfig.
 */
struct ContentInspectConfigEx {
  bool enable;
  /** video moderation work type.*/
  CONTENT_INSPECT_WORK_TYPE ContentWorkType;

  /**the type of video moderation on device.*/
  CONTENT_INSPECT_DEVICE_TYPE DeviceWorkType;

  /**the type of video moderation on device.*/
  CONTENT_INSPECT_CLOUD_TYPE CloudWorkType;
  std::string extraInfo;
  /**
   * @technical preview
   */
  std::string serverConfig;
  
  rtc::IFileUploaderService* fileUploader;
  /**The content inspect modules, max length of modules is 32.
   * the content(snapshot of send video stream, image) can be used to max of 32 types functions.
   */
  ContentInspectModuleEx modules[MAX_CONTENT_INSPECT_MODULE_COUNT];
  /**The content inspect module count.
   */
  int moduleCount;

   ContentInspectConfigEx& operator=(const ContentInspectConfigEx& rth)
  {
    enable = rth.enable;
    extraInfo = rth.extraInfo;
    serverConfig = rth.serverConfig;
    moduleCount = rth.moduleCount;
    fileUploader = rth.fileUploader;
    DeviceWorkType = rth.DeviceWorkType;
    ContentWorkType = rth.ContentWorkType;
    CloudWorkType = rth.CloudWorkType;
    for(int i = 0; i < MAX_CONTENT_INSPECT_MODULE_COUNT; i++) {
      modules[i].type = rth.modules[i].type;
      modules[i].interval = rth.modules[i].interval;
    }
    return *this;
  }

  ContentInspectConfigEx(const ContentInspectConfigEx& rth){
    enable = rth.enable;
    extraInfo = rth.extraInfo;
    serverConfig = rth.serverConfig;
    moduleCount = rth.moduleCount;
    fileUploader = rth.fileUploader;
    DeviceWorkType = rth.DeviceWorkType;
    ContentWorkType = rth.ContentWorkType;
    CloudWorkType = rth.CloudWorkType;
    for(int i = 0; i < MAX_CONTENT_INSPECT_MODULE_COUNT; i++) {
      modules[i].type = rth.modules[i].type;
      modules[i].interval = rth.modules[i].interval;
    }
  }

  ContentInspectConfigEx(bool enable, const ContentInspectConfig& config, rtc::IFileUploaderService* uploader, CONTENT_INSPECT_CLOUD_TYPE cloudWorkType) : enable(enable), ContentWorkType(CONTENT_INSPECT_WORK_CLOUD),fileUploader(uploader),DeviceWorkType(CONTENT_INSPECT_DEVICE_INVALID),CloudWorkType(cloudWorkType), moduleCount(0){
    if(config.extraInfo != NULL) {
        extraInfo = config.extraInfo;
    }
    if(config.serverConfig != NULL) {
        serverConfig = config.serverConfig;
    }
    moduleCount = config.moduleCount;
    for(int i = 0; i < MAX_CONTENT_INSPECT_MODULE_COUNT; i++) {
      modules[i].type = config.modules[i].type;
      modules[i].interval = config.modules[i].interval;
    }
  }
  ContentInspectConfigEx() : enable(false), ContentWorkType(CONTENT_INSPECT_WORK_CLOUD),fileUploader(nullptr),DeviceWorkType(CONTENT_INSPECT_DEVICE_INVALID),CloudWorkType(CONTENT_INSPECT_CLOUD_AGORA), moduleCount(0){
  }
};

}  // namespace rtc
}  // namespace agora
