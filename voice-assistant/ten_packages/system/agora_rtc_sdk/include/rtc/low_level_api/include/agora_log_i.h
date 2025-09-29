//
//  Agora Media SDK
//
//  Created by ChenZhipeng in 2022-06.
//  Copyright (c) 2022 Agora IO. All rights reserved.
//
#pragma once

#include "stdarg.h"
#include <inttypes.h>
#include <stdint.h>

namespace agora {
namespace commons {

enum log_filters {
  AGORA_LOG_NONE = 0x0000,  // no trace
  AGORA_LOG_INFO = 0x0001,
  AGORA_LOG_WARN = 0x0002,
  AGORA_LOG_ERROR = 0x0004,
  AGORA_LOG_FATAL = 0x0008,
  AGORA_LOG_DEFAULT = 0x000f,
  AGORA_LOG_API_CALL = 0x0010,
  AGORA_LOG_MODULE_CALL = 0x0020,
  AGORA_LOG_QUALITY = 0x0040,
  AGORA_LOG_DIAGNOSE = 0x0080,
  AGORA_LOG_MEM = 0x0100,     // memory info
  AGORA_LOG_TIMER = 0x0200,   // timing info
  AGORA_LOG_STREAM = 0x0400,  // "continuous" stream of data
  // used for debug purposes
  AGORA_LOG_DEBUG = 0x0800,  // debug
  AGORA_LOG_USER_API_CALL = 0x1000,
  AGORA_LOG_CONSOLE = 0x8000,
  AGORA_LOG_ALL = 0xffff,
  AGORA_LOG_NO_API = 0xefef,

  AGORA_LOG_INVALID = (int32_t)-1,
};

#if defined(__APPLE__)
#if defined(__clang__) &&                                                      \
    (__clang_major__ * 100 + __clang_minor__ * 10 + __clang_patchlevel__ >=    \
     1316)
#define LOG_FORMAT_CHECK 1
#endif
#elif defined(__clang__) || defined(__GNUC__)
#define LOG_FORMAT_CHECK 1
#endif

#if defined(LOG_FORMAT_CHECK)
__attribute__((format(printf, 2, 3)))
#endif
void log(log_filters level, const char* fmt, ...);

void logv(log_filters level, const char *fmt, va_list ap);

} // namespace commons
} // namespace agora

// Log format is strict now, for instance: you must use PRId64 when print
// int64_t If you have any trouble with or advice to log format goto
// https://confluence.agoralab.co/pages/viewpage.action?pageId=1037828374
