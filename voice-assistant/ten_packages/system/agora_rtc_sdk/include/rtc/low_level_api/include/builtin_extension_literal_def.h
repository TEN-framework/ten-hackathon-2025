//
//  Agora Media SDK
//
//  Created by Yaqi Li in 2021-12.
//  Copyright (c) 2021 Agora IO. All rights reserved.
//
#pragma once

namespace agora {
namespace extension {

static const char* const SCAP_PROP_KEY_CAP_USE_MGF = "cap_use_mgf";
static const char* const SCAP_PROP_KEY_CAP_USE_DXGI = "cap_use_dxgi";
static const char* const SCAP_PROP_KEY_CAP_USE_WGC = "cap_use_wgc";
static const char* const SCAP_PROP_KEY_CAP_SHOW_WGC_BORDER = "cap_show_wgc_border";
static const char* const SCAP_PROP_KEY_CAP_FORCE_SCREEN = "cap_force_screen";
static const char* const SCAP_PROP_KEY_CAP_WINDOW_FOCUS = "cap_window_focus";
static const char* const SCAP_PROP_KEY_CAP_IMPL_TYPE = "cap_impl_type";
static const char* const SCAP_PROP_KEY_CAP_COLOR_MATRIX = "cap_color_matrix";
static const char* const SCAP_PROP_KEY_CAP_COLOR_RANGE = "cap_color_range";
static const char* const SCAP_PROP_KEY_CAP_MODE = "cap_mode";
static const char* const SCAP_PROP_KEY_CAP_PROMOTE_GPU_PRIORITY = "cap_allow_eanble_promote_gpu_priority";
static const char* const SCAP_PROP_KEY_CAP_FORCE_USE_BITBLT_ON_WIN7 = "cap_force_use_bitblt_on_win7";
static const char* const SCAP_PROP_KEY_CAP_FALLBACK_TO_GDI_WITH_WGC_BORDER_ISSUE = "cap_fallback_to_gdi_with_wgc_border_issue";

static const char* const SCAP_PROP_VAL_CAP_IMPL_MAGNIFY = "cap_impl_magnification";
static const char* const SCAP_PROP_VAL_CAP_IMPL_DXGI = "cap_impl_dxgi";
static const char* const SCAP_PROP_VAL_CAP_IMPL_GDI = "cap_impl_gdi";
static const char* const SCAP_PROP_VAL_CAP_IMPL_AUTO = "cap_impl_auto";

static const char* const SCAP_EVENT_WINDOW_CLOSED = "cap_window_closed";
static const char* const SCAP_EVENT_WINDOW_MINIMIZED = "cap_window_minimized";
static const char* const SCAP_EVENT_WINDOW_HIDDEN = "cap_window_hidden";
static const char* const SCAP_EVENT_WINDOW_RECOVER_FROM_HIDDEN = "cap_window_recover_from_hidden";
static const char* const SCAP_EVENT_WINDOW_RECOVER_FROM_MINIMIZED = "cap_window_recover_from_minimized";
static const char* const SCAP_EVENT_NO_PERMISION = "cap_no_permision";
static const char* const SCAP_EVENT_OK = "cap_ok";
static const char* const SCAP_EVENT_CAPTURE_CONNECTED = "cap_connected";
static const char* const SCAP_EVENT_CAPTURE_DISCONNECTED = "cap_disconnected";
static const char* const SCAP_EVENT_CAPTURE_FAILED = "cap_failed";
static const char* const SCAP_EVENT_DISPLAY_DISCONNECTED = "cap_display_disconnected";
static const char* const SCAP_EVENT_AUTO_FALLBACK = "cap_auto_fallback";
static const char* const SCAP_EVENT_CAPTURE_PAUSED = "cap_paused";
static const char* const SCAP_EVENT_CAPTURE_RESUMED = "cap_resumed";

static const char* const SCAP_PROP_KEY_IPC_PORT = "cap_ipc_port";
static const char* const SCAP_PROP_KEY_CAP_AUDIO = "cap_audio";
static const char* const SCAP_PROP_KEY_CAP_VIDEO = "cap_video";
static const char* const SCAP_PROP_KEY_CAP_MAX_AUDIO_FRAME = "cap_max_audio_frame";

static const char* const SCAP_PROP_KEY_CAP_CROP_WIN = "cap_crop_window";
static const char* const SCAP_PROP_KEY_CAP_MASK_OCCLUED = "cap_maskocclued_window";
static const char* const SCAP_PROP_KEY_CAP_MUTI_GPU = "cap_mutigpu_exclude";
static const char* const SCAP_PROP_KEY_CAP_EXCLUDE_HIGHLIGHT_BORDER = "cap_exclude_highlight_border";
static const char* const SCAP_PROP_KEY_CAP_CAPTURE_TO_TEXTURE = "cap_capture_to_texture";
static const char* const SCAP_PROP_KEY_CAP_EXCLUDE_HIGHLIGHT_BORDER_FOR_MAGNIFIER = "cap_exclude_highlight_border_for_magnifier";
static const char* const SCAP_PROP_KEY_CAP_FORCE_USE_NV12_TEXTURE = "cap_force_use_nv12_texture";

} // namespace extension
} // namespace agora
