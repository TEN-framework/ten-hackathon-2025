//
//  Agora Media SDK
//
//  Created by Rao Qi in 2019-05.
//  Copyright (c) 2019 Agora IO. All rights reserved.
//
#pragma once

#include <cstdint>
#include <sstream>
#include <string>

#include "AgoraBase.h"
#include "AgoraOptional.h"

#if defined(WEBRTC_WIN)
#define NEW_LINE "\r\n"
#else
#define NEW_LINE "\n"
#endif

namespace agora {
namespace rtc {

struct VideoConfigurationEx {
 public:
  // do NOT add any default value here
  VideoConfigurationEx() = default;
  ~VideoConfigurationEx() = default;
  void SetAll(const VideoConfigurationEx& change) {
#define SET_FROM(X) SetFrom(&X, change.X)

    SET_FROM(codec_type);
    SET_FROM(h265_screen_enable);
    SET_FROM(frame_width);
    SET_FROM(frame_height);
    SET_FROM(frame_rate);
    SET_FROM(start_bitrate);
    SET_FROM(target_bitrate);
    SET_FROM(min_bitrate);
    SET_FROM(max_bitrate);
    SET_FROM(actual_max_bitrate);
    SET_FROM(orientation_mode);
    SET_FROM(number_of_temporal_layers);
    SET_FROM(simulcast_stream_number_of_temporal_layers);
    SET_FROM(number_of_bframe_temporal_layers);
    SET_FROM(sps_data);
    SET_FROM(pps_data);
    SET_FROM(h264_profile);
    SET_FROM(minor_stream_h264_profile);
    SET_FROM(adaptive_op_mode);
    SET_FROM(number_of_spatial_layers);
    SET_FROM(flexible_mode);
    SET_FROM(interlayer_pred);
    SET_FROM(num_of_encoder_cores);
    SET_FROM(degradation_preference);
    SET_FROM(fps_down_step);
    SET_FROM(fps_up_step);
    SET_FROM(vqc_version);
    SET_FROM(vqc_force_use_version);
    SET_FROM(overuse_detector_version);
    //TODO(kefan) these vqc parameters should placed in MediaEngineParameterCollection
    SET_FROM(vqc_quick_adaptNetwork);
    SET_FROM(vqc_min_framerate);
    SET_FROM(vqc_settings_by_resolution);
    SET_FROM(vqc_min_holdtime_auto_resize_zoomin);
    SET_FROM(vqc_min_holdtime_auto_resize_zoomout);
    SET_FROM(vqc_qp_adjust);
    SET_FROM(vqc_ios_h265_adjust);
    SET_FROM(min_qp);
    SET_FROM(max_qp);
    SET_FROM(frame_max_size);
    SET_FROM(fec_fix_rate);
    SET_FROM(quick_response_intra_request);
    SET_FROM(fec_method);
    SET_FROM(enable_pvc);
    SET_FROM(pvc_max_support_resolution);
    SET_FROM(enable_pvc_verify);
    SET_FROM(enable_sr_verify);
    SET_FROM(sr_verify_type);
    SET_FROM(color_space_enable);
    SET_FROM(videoFullrange);
    SET_FROM(matrixCoefficients);
    SET_FROM(enable_sr);
    SET_FROM(sr_type);
    SET_FROM(save_encode_bitrate);
    SET_FROM(save_encode_bitrate_minor_stream);
    SET_FROM(save_encode_bitrate_params);

    SET_FROM(complexity);
    SET_FROM(denoising_on);
    SET_FROM(automatic_resize_on);
    SET_FROM(frame_dropping_on);
    SET_FROM(has_intra_request);
    SET_FROM(key_frame_interval);
    SET_FROM(entropy_coding_mode_flag);
    SET_FROM(loop_filter_disable_idc);
    SET_FROM(background_detection_on);
    SET_FROM(posted_frames_waiting_for_encode);
    SET_FROM(bitrate_adjust_ratio);
    SET_FROM(minbitrate_ratio);
    SET_FROM(quality_scale_only_on_average_qp);
    SET_FROM(h264_qp_thresholds_low);
    SET_FROM(h264_qp_thresholds_high);
    SET_FROM(dec_mosreport);
    SET_FROM(reset_bitrate_ratio);
    SET_FROM(reset_framerate_ratio);  
    SET_FROM(enable_hw_decoder);
    SET_FROM(enable_background_hw_decode);
    SET_FROM(hw_decoder_provider);
    SET_FROM(decoder_thread_num);
    SET_FROM(low_stream_enable_hw_encoder);
    SET_FROM(enable_hw_encoder);
    SET_FROM(force_hw_encoder);
    SET_FROM(hw_encoder_provider);
    SET_FROM(default_enable_hwenc_win32);
    SET_FROM(hwenc_blacklist);
    SET_FROM(av_enc_codec_type);
    SET_FROM(av_enc_common_quality);
    SET_FROM(av_enc_common_rate_control_mode);
    SET_FROM(vdm_not_override_lua_smallvideo_not_use_hwenc_policy);
    SET_FROM(enable_video_sender_frame_dropper);
    SET_FROM(enable_video_qoe_assess);
    SET_FROM(h264_hw_min_res_level);
    SET_FROM(av_enc_video_max_slices);
    SET_FROM(video_encoder_rc_limit_value);
    SET_FROM(video_encoder_rc_scene);
    SET_FROM(video_encoder_impair_net_ref_opt);
    SET_FROM(av_sw_enc_dump_frame_info);
    SET_FROM(vp8_enc_switch);
    SET_FROM(av1_dec_enable);
    SET_FROM(h265_dec_enable);
    SET_FROM(av1_camera_enable);
    SET_FROM(av1_screen_enable);
    SET_FROM(av1_feedback_enable);
    SET_FROM(enc_scc_enable);
    SET_FROM(major_stream_encoder_thread_num);
    SET_FROM(minor_stream_encoder_thread_num);
    SET_FROM(enable_change_encoder_profile);
    SET_FROM(minscore_for_swh265enc);
    SET_FROM(min_enc_level);
    SET_FROM(wz265_dec_enable);

    SET_FROM(JBMinDelayForRDCEnable);
    SET_FROM(enable_video_vpr);
    SET_FROM(video_vpr_init_size);
    SET_FROM(video_vpr_max_size);
    SET_FROM(video_vpr_frozen_ms_thres);
    SET_FROM(video_vpr_frozen_rate_thres);
    SET_FROM(video_vpr_method);
    SET_FROM(video_vpr_adaptive_thres);
    SET_FROM(retrans_detect_enable);
    SET_FROM(use_sent_ts_enable);
    SET_FROM(enable_minor_stream_intra_request);
    SET_FROM(video_rotation);
    SET_FROM(scale_type);
    SET_FROM(scc_auto_framerate);
    SET_FROM(scc_quality_opt);
    SET_FROM(video_render_d3d9_texture);
    SET_FROM(video_render_d3d9_render_mode);
    SET_FROM(video_render_buffer_queue_size);
    SET_FROM(video_render_vsync_switch);
    SET_FROM(video_force_texture_to_i420);
    SET_FROM(video_windows_capture_to_texture); 
    SET_FROM(video_android_capturer_copy_enable);
    SET_FROM(video_enable_high_definition_strategy);
    SET_FROM(av_enc_video_width_alignment);
    SET_FROM(av_enc_video_height_alignment);
    SET_FROM(av_enc_video_enable_dequeue_timewait);
    SET_FROM(av_enc_video_adjustment_reset);
    SET_FROM(av_enc_video_force_alignment);
    SET_FROM(av_dec_texture_copy_enable);
    SET_FROM(av_dec_output_byte_frame);
    SET_FROM(av_dec_output_byte_frame_resolution_product_thres);
    SET_FROM(av_dec_video_hwdec_config);
    SET_FROM(av_enc_video_hwenc_config);
    SET_FROM(av_enc_hw_hevc_exceptions);
    SET_FROM(av_dec_hw_hevc_exceptions);
    SET_FROM(av_enc_hw_exceptions);
    SET_FROM(av_dec_sw_a264_enable);

    SET_FROM(av_enc_video_use_a264);
    SET_FROM(av_enc_video_qp_parser_skip);
    SET_FROM(av_enc_video_enable_roi);
    SET_FROM(roi_max_qp);
    SET_FROM(roi_qp_offset);
    SET_FROM(av_enc_vmaf_calc);
    SET_FROM(video_enc_min_scc_auto_framerate);
    SET_FROM(av_enc_profiling);
    SET_FROM(av_enc_param_config);
    SET_FROM(av_enc_advanced_param_config);
    SET_FROM(av_enc_screen_sharing_subclass);

    SET_FROM(enable_iptos);

    SET_FROM(key_frame_interval_intra_request);
    SET_FROM(video_switch_soft_decoder_threshold);
    SET_FROM(min_encode_keyframe_interval);
    SET_FROM(bFrames);
    SET_FROM(enable_bframe);
    SET_FROM(bitrate_ceiling_ratio);
    SET_FROM(video_skip_enable);
    SET_FROM(av_enc_new_complexity);
    SET_FROM(av_enc_default_complexity);
    SET_FROM(av_enc_intra_key_interval);
    SET_FROM(key_force_device_score);
    SET_FROM(av_enc_bitrate_adjustment_type);
    SET_FROM(use_single_slice_parser);
    SET_FROM(enable_parser_reject);
      
    SET_FROM(av_enc_send_sei_alpha);
    SET_FROM(av_enc_alpha_data_codec_type);
    SET_FROM(av_enc_alpha_data_scale_mode);
    SET_FROM(av_enc_encode_alpha);
    SET_FROM(enable_hw_encoder_quickly_start);
    SET_FROM(initial_hw_encoder_quickly_start);
    SET_FROM(fake_enc_error_code);
    SET_FROM(enable_smooth_enc_codec_change);

    SET_FROM(direct_cdn_streaming_h264_profile);
    SET_FROM(fps_est_window_size_ms);
    SET_FROM(default_enable_hw_encoder);
    SET_FROM(use_keyframe_type_from_parser);
    SET_FROM(frame_glitching_detect_level);
    SET_FROM(enable_minor_stream_codec_follow_major_stream);
    SET_FROM(decode_key_frame_only_flag);
    SET_FROM(av_sw_enc_rc_use_capture_time);
    SET_FROM(feedback_mode);
    SET_FROM(response_quick_intra_request);
#undef SET_FROM
  }

  bool operator==(const VideoConfigurationEx& o) const {
#define BEGIN_COMPARE() bool b = true
#define ADD_COMPARE(X) b = (b && (X == o.X))
#define END_COMPARE()

    BEGIN_COMPARE();
    ADD_COMPARE(codec_type);
    ADD_COMPARE(h265_screen_enable);
    ADD_COMPARE(frame_width);
    ADD_COMPARE(frame_height);
    ADD_COMPARE(frame_rate);
    ADD_COMPARE(start_bitrate);
    ADD_COMPARE(target_bitrate);
    ADD_COMPARE(min_bitrate);
    ADD_COMPARE(orientation_mode);
    ADD_COMPARE(number_of_temporal_layers);
    ADD_COMPARE(simulcast_stream_number_of_temporal_layers);
    ADD_COMPARE(number_of_bframe_temporal_layers);
    ADD_COMPARE(sps_data);
    ADD_COMPARE(pps_data);
    ADD_COMPARE(h264_profile);
    ADD_COMPARE(minor_stream_h264_profile);
    ADD_COMPARE(adaptive_op_mode);
    ADD_COMPARE(number_of_spatial_layers);
    ADD_COMPARE(flexible_mode);
    ADD_COMPARE(interlayer_pred);
    ADD_COMPARE(num_of_encoder_cores);
    ADD_COMPARE(degradation_preference);
    ADD_COMPARE(fps_down_step);
    ADD_COMPARE(fps_up_step);
    ADD_COMPARE(vqc_version);
    ADD_COMPARE(vqc_force_use_version);
    ADD_COMPARE(overuse_detector_version);
    //TODO(kefan) these vqc parameters should placed in MediaEngineParameterCollection
    ADD_COMPARE(vqc_quick_adaptNetwork);
    ADD_COMPARE(vqc_min_framerate);
    ADD_COMPARE(vqc_settings_by_resolution);
    ADD_COMPARE(vqc_min_holdtime_auto_resize_zoomin);
    ADD_COMPARE(vqc_min_holdtime_auto_resize_zoomout);
    ADD_COMPARE(vqc_qp_adjust);
    ADD_COMPARE(vqc_ios_h265_adjust);
    ADD_COMPARE(min_qp);
    ADD_COMPARE(max_qp);
    ADD_COMPARE(frame_max_size);   
    ADD_COMPARE(fec_fix_rate);
    ADD_COMPARE(quick_response_intra_request);
    ADD_COMPARE(fec_method);
    ADD_COMPARE(enable_pvc);
    ADD_COMPARE(pvc_max_support_resolution);
    ADD_COMPARE(enable_pvc_verify);
    ADD_COMPARE(enable_sr_verify);
    ADD_COMPARE(sr_verify_type);
    ADD_COMPARE(enable_sr);
    ADD_COMPARE(sr_type);
    ADD_COMPARE(save_encode_bitrate);
    ADD_COMPARE(save_encode_bitrate_minor_stream);
    ADD_COMPARE(save_encode_bitrate_params);

    ADD_COMPARE(complexity);
    ADD_COMPARE(denoising_on);
    ADD_COMPARE(automatic_resize_on);
    ADD_COMPARE(frame_dropping_on);
    ADD_COMPARE(has_intra_request);
    ADD_COMPARE(key_frame_interval);
    ADD_COMPARE(entropy_coding_mode_flag);
    ADD_COMPARE(loop_filter_disable_idc);
    ADD_COMPARE(background_detection_on);
    ADD_COMPARE(posted_frames_waiting_for_encode);
    ADD_COMPARE(bitrate_adjust_ratio);
    ADD_COMPARE(minbitrate_ratio);
    ADD_COMPARE(quality_scale_only_on_average_qp);
    ADD_COMPARE(h264_qp_thresholds_low);
    ADD_COMPARE(h264_qp_thresholds_high);
    ADD_COMPARE(dec_mosreport);
    ADD_COMPARE(reset_bitrate_ratio);
    ADD_COMPARE(reset_framerate_ratio);
    ADD_COMPARE(enable_hw_decoder);
    ADD_COMPARE(enable_background_hw_decode);
    ADD_COMPARE(hw_decoder_provider);
    ADD_COMPARE(decoder_thread_num);
    ADD_COMPARE(low_stream_enable_hw_encoder);
    ADD_COMPARE(enable_hw_encoder);
    ADD_COMPARE(force_hw_encoder);
    ADD_COMPARE(hw_encoder_provider);
    ADD_COMPARE(av_enc_codec_type);
    ADD_COMPARE(av_enc_common_quality);
    ADD_COMPARE(av_enc_common_rate_control_mode);
    ADD_COMPARE(scc_auto_framerate);
    ADD_COMPARE(scc_quality_opt);
    ADD_COMPARE(video_render_d3d9_texture);
    ADD_COMPARE(video_render_d3d9_render_mode);
    ADD_COMPARE(video_render_buffer_queue_size);
    ADD_COMPARE(video_render_vsync_switch);
    ADD_COMPARE(video_force_texture_to_i420);
    ADD_COMPARE(video_windows_capture_to_texture);
    ADD_COMPARE(video_android_capturer_copy_enable);
    ADD_COMPARE(video_enable_high_definition_strategy);
    ADD_COMPARE(vdm_not_override_lua_smallvideo_not_use_hwenc_policy);
    ADD_COMPARE(enable_video_sender_frame_dropper);
    ADD_COMPARE(enable_video_qoe_assess);
    ADD_COMPARE(h264_hw_min_res_level);
    ADD_COMPARE(av_enc_video_max_slices);
    ADD_COMPARE(video_encoder_rc_limit_value);
    ADD_COMPARE(video_encoder_rc_scene);
    ADD_COMPARE(video_encoder_impair_net_ref_opt);
    ADD_COMPARE(av_sw_enc_dump_frame_info);
    ADD_COMPARE(vp8_enc_switch);
    ADD_COMPARE(h265_dec_enable);
    ADD_COMPARE(av1_dec_enable);
    ADD_COMPARE(av1_camera_enable);
    ADD_COMPARE(av1_feedback_enable);
    ADD_COMPARE(av1_screen_enable);
    ADD_COMPARE(enc_scc_enable);
    ADD_COMPARE(major_stream_encoder_thread_num);
    ADD_COMPARE(minor_stream_encoder_thread_num);
    ADD_COMPARE(color_space_enable);
    ADD_COMPARE(videoFullrange);
    ADD_COMPARE(matrixCoefficients);
    
    ADD_COMPARE(min_enc_level);
    ADD_COMPARE(minscore_for_swh265enc);
    ADD_COMPARE(default_enable_hwenc_win32);
    ADD_COMPARE(hwenc_blacklist);
    ADD_COMPARE(enable_change_encoder_profile);
    ADD_COMPARE(wz265_dec_enable);

    ADD_COMPARE(JBMinDelayForRDCEnable);
    ADD_COMPARE(enable_video_vpr);
    ADD_COMPARE(video_vpr_init_size);
    ADD_COMPARE(video_vpr_max_size);
    ADD_COMPARE(video_vpr_frozen_ms_thres);
    ADD_COMPARE(video_vpr_frozen_rate_thres);
    ADD_COMPARE(video_vpr_method);
    ADD_COMPARE(video_vpr_adaptive_thres);
    ADD_COMPARE(av_enc_intra_key_interval);    
    ADD_COMPARE(key_force_device_score);
    ADD_COMPARE(av_enc_bitrate_adjustment_type);
    ADD_COMPARE(retrans_detect_enable);
    ADD_COMPARE(use_sent_ts_enable);
    ADD_COMPARE(enable_minor_stream_intra_request);
    ADD_COMPARE(video_rotation);
    ADD_COMPARE(scale_type);
    ADD_COMPARE(av_enc_video_use_a264);
    ADD_COMPARE(av_enc_video_qp_parser_skip);
    ADD_COMPARE(av_enc_video_enable_roi);
    ADD_COMPARE(roi_max_qp);
    ADD_COMPARE(roi_qp_offset);
    ADD_COMPARE(av_enc_vmaf_calc);
    ADD_COMPARE(video_enc_min_scc_auto_framerate);
    ADD_COMPARE(av_enc_profiling);
    ADD_COMPARE(av_enc_param_config);
    ADD_COMPARE(av_enc_advanced_param_config);
    ADD_COMPARE(av_enc_screen_sharing_subclass);
    ADD_COMPARE(av_enc_video_width_alignment);
    ADD_COMPARE(av_enc_video_height_alignment);
    ADD_COMPARE(av_enc_video_force_alignment);
    ADD_COMPARE(av_enc_video_enable_dequeue_timewait);
    ADD_COMPARE(av_enc_video_adjustment_reset);
    ADD_COMPARE(av_dec_texture_copy_enable);
    ADD_COMPARE(av_dec_output_byte_frame);
    ADD_COMPARE(av_dec_output_byte_frame_resolution_product_thres);

    ADD_COMPARE(enable_iptos);

    ADD_COMPARE(key_frame_interval_intra_request);
    ADD_COMPARE(video_switch_soft_decoder_threshold);
    ADD_COMPARE(min_encode_keyframe_interval);
    ADD_COMPARE(bFrames);
    ADD_COMPARE(enable_bframe);
    ADD_COMPARE(video_skip_enable);
    ADD_COMPARE(av_enc_new_complexity);
    ADD_COMPARE(av_enc_default_complexity);
    ADD_COMPARE(use_single_slice_parser);
    ADD_COMPARE(av_enc_video_hwenc_config);
    ADD_COMPARE(av_dec_video_hwdec_config);
    ADD_COMPARE(av_enc_hw_hevc_exceptions);
    ADD_COMPARE(av_dec_hw_hevc_exceptions);
    ADD_COMPARE(av_enc_hw_exceptions);
    ADD_COMPARE(av_dec_sw_a264_enable);
    ADD_COMPARE(enable_parser_reject);
    ADD_COMPARE(direct_cdn_streaming_h264_profile);
    
    ADD_COMPARE(av_enc_send_sei_alpha);
    ADD_COMPARE(av_enc_alpha_data_codec_type);
    ADD_COMPARE(av_enc_alpha_data_scale_mode);
    ADD_COMPARE(av_enc_encode_alpha);
    ADD_COMPARE(enable_hw_encoder_quickly_start);
    ADD_COMPARE(initial_hw_encoder_quickly_start);
    ADD_COMPARE(fake_enc_error_code);
    ADD_COMPARE(enable_smooth_enc_codec_change);
    ADD_COMPARE(fps_est_window_size_ms);
    ADD_COMPARE(default_enable_hw_encoder);
    ADD_COMPARE(use_keyframe_type_from_parser);
    ADD_COMPARE(frame_glitching_detect_level);
    ADD_COMPARE(enable_minor_stream_codec_follow_major_stream);
    ADD_COMPARE(decode_key_frame_only_flag);
    ADD_COMPARE(av_sw_enc_rc_use_capture_time);
    ADD_COMPARE(feedback_mode);
    ADD_COMPARE(response_quick_intra_request);
    END_COMPARE();

#undef BEGIN_COMPARE
#undef ADD_COMPARE
#undef END_COMPARE
    return b;
  }

  bool operator!=(const VideoConfigurationEx& o) const { return !(*this == o); }

  std::string ToString() const {
#define ADD_STRING(X) ost << ToStringIfSet(#X, X)

    std::ostringstream ost;
    ADD_STRING(codec_type);
    ADD_STRING(h265_screen_enable);
    ADD_STRING(frame_width);
    ADD_STRING(frame_height);
    ADD_STRING(frame_rate);
    ADD_STRING(start_bitrate);
    ADD_STRING(target_bitrate);
    ADD_STRING(min_bitrate);
    ADD_STRING(max_bitrate);
    ADD_STRING(actual_max_bitrate);
    ADD_STRING(orientation_mode);
    ADD_STRING(number_of_temporal_layers);
    ADD_STRING(simulcast_stream_number_of_temporal_layers);
    ADD_STRING(number_of_bframe_temporal_layers);
    ADD_STRING(sps_data);
    ADD_STRING(pps_data);
    ADD_STRING(h264_profile);
    ADD_STRING(minor_stream_h264_profile);
    ADD_STRING(adaptive_op_mode);
    ADD_STRING(number_of_spatial_layers);
    ADD_STRING(flexible_mode);
    ADD_STRING(interlayer_pred);
    ADD_STRING(num_of_encoder_cores);
    ADD_STRING(degradation_preference);
    ADD_STRING(fps_down_step);
    ADD_STRING(fps_up_step);
    ADD_STRING(vqc_version);
    ADD_STRING(vqc_force_use_version);
    ADD_STRING(overuse_detector_version);
    //TODO(kefan) these vqc parameters should placed in MediaEngineParameterCollection
    ADD_STRING(vqc_quick_adaptNetwork);
    ADD_STRING(vqc_min_framerate);
    ADD_STRING(vqc_settings_by_resolution);
    ADD_STRING(vqc_min_holdtime_auto_resize_zoomin);
    ADD_STRING(vqc_min_holdtime_auto_resize_zoomout);
    ADD_STRING(vqc_qp_adjust);
    ADD_STRING(vqc_ios_h265_adjust);
    ADD_STRING(min_qp);
    ADD_STRING(max_qp);
    ADD_STRING(frame_max_size);   
    ADD_STRING(fec_fix_rate);
    ADD_STRING(quick_response_intra_request);
    ADD_STRING(fec_method);
    ADD_STRING(enable_pvc);
    ADD_STRING(pvc_max_support_resolution);
    ADD_STRING(enable_pvc_verify);
    ADD_STRING(enable_sr_verify);
    ADD_STRING(sr_verify_type);
    ADD_STRING(enable_sr);
    ADD_STRING(sr_type); 

    ADD_STRING(complexity);
    ADD_STRING(denoising_on);
    ADD_STRING(automatic_resize_on);
    ADD_STRING(frame_dropping_on);
    ADD_STRING(has_intra_request);
    ADD_STRING(key_frame_interval);
    ADD_STRING(entropy_coding_mode_flag);
    ADD_STRING(loop_filter_disable_idc);
    ADD_STRING(background_detection_on);
    ADD_STRING(posted_frames_waiting_for_encode);
    ADD_STRING(bitrate_adjust_ratio);
    ADD_STRING(minbitrate_ratio);
    ADD_STRING(quality_scale_only_on_average_qp);
    ADD_STRING(h264_qp_thresholds_low);
    ADD_STRING(h264_qp_thresholds_high);
    ADD_STRING(dec_mosreport);
    ADD_STRING(reset_bitrate_ratio);
    ADD_STRING(reset_framerate_ratio);
    ADD_STRING(enable_hw_decoder);
    ADD_STRING(enable_background_hw_decode);
    ADD_STRING(hw_decoder_provider);
    ADD_STRING(decoder_thread_num);
    ADD_STRING(low_stream_enable_hw_encoder);
    ADD_STRING(enable_hw_encoder);
    ADD_STRING(force_hw_encoder);
    ADD_STRING(hw_encoder_provider);
    ADD_STRING(av_enc_codec_type);
    ADD_STRING(av_enc_common_quality);
    ADD_STRING(av_enc_common_rate_control_mode);
    ADD_STRING(vdm_not_override_lua_smallvideo_not_use_hwenc_policy);
    ADD_STRING(enable_video_sender_frame_dropper);
    ADD_STRING(enable_video_qoe_assess);
    ADD_STRING(h264_hw_min_res_level);
    ADD_STRING(av_enc_video_max_slices);
    ADD_STRING(video_encoder_rc_limit_value);
    ADD_STRING(video_encoder_rc_scene);
    ADD_STRING(video_encoder_impair_net_ref_opt);
    ADD_STRING(av_sw_enc_dump_frame_info);
    ADD_STRING(vp8_enc_switch);
    ADD_STRING(h265_dec_enable);
    ADD_STRING(av1_dec_enable);
    ADD_STRING(av1_camera_enable);
    ADD_STRING(av1_feedback_enable);
    ADD_STRING(av1_screen_enable);
    ADD_STRING(enc_scc_enable);
    ADD_STRING(major_stream_encoder_thread_num);
    ADD_STRING(minor_stream_encoder_thread_num);
    ADD_STRING(save_encode_bitrate);
    ADD_STRING(save_encode_bitrate_minor_stream);
    ADD_STRING(save_encode_bitrate_params);

    ADD_STRING(min_enc_level);
    ADD_STRING(minscore_for_swh265enc);
    ADD_STRING(default_enable_hwenc_win32);
    ADD_STRING(hwenc_blacklist);
    ADD_STRING(enable_change_encoder_profile);
	
    ADD_STRING(wz265_dec_enable);
    
    ADD_STRING(color_space_enable);
    ADD_STRING(videoFullrange);
    ADD_STRING(matrixCoefficients);

    ADD_STRING(JBMinDelayForRDCEnable);
    ADD_STRING(enable_video_vpr);
    ADD_STRING(video_vpr_init_size);
    ADD_STRING(video_vpr_max_size);
    ADD_STRING(video_vpr_frozen_ms_thres);
    ADD_STRING(video_vpr_frozen_rate_thres);
    ADD_STRING(video_vpr_method);
    ADD_STRING(video_vpr_adaptive_thres);
    ADD_STRING(retrans_detect_enable);
    ADD_STRING(use_sent_ts_enable);
    ADD_STRING(enable_minor_stream_intra_request);
    ADD_STRING(video_rotation);
    ADD_STRING(scale_type);
    ADD_STRING(scc_auto_framerate);
    ADD_STRING(scc_quality_opt);
    ADD_STRING(video_render_d3d9_texture);
    ADD_STRING(video_render_d3d9_render_mode);
    ADD_STRING(video_render_buffer_queue_size);
    ADD_STRING(video_render_vsync_switch);
    ADD_STRING(video_force_texture_to_i420);
    ADD_STRING(video_windows_capture_to_texture);
    ADD_STRING(video_android_capturer_copy_enable);
    ADD_STRING(video_enable_high_definition_strategy);
    ADD_STRING(av_enc_video_width_alignment);
    ADD_STRING(av_enc_video_height_alignment);
    ADD_STRING(av_enc_video_force_alignment);
    ADD_STRING(av_enc_video_enable_dequeue_timewait);
    ADD_STRING(av_enc_video_adjustment_reset);
    ADD_STRING(av_dec_texture_copy_enable);
    ADD_STRING(av_dec_output_byte_frame);
    ADD_STRING(av_dec_output_byte_frame_resolution_product_thres);
    ADD_STRING(av_dec_video_hwdec_config);
    ADD_STRING(av_enc_video_hwenc_config);
    ADD_STRING(av_enc_hw_hevc_exceptions);
    ADD_STRING(av_dec_hw_hevc_exceptions);
    ADD_STRING(av_enc_hw_exceptions);
    ADD_STRING(av_dec_sw_a264_enable);

    ADD_STRING(av_enc_video_use_a264);
    ADD_STRING(av_enc_video_qp_parser_skip);
    ADD_STRING(av_enc_video_enable_roi);
    ADD_STRING(roi_max_qp);
    ADD_STRING(roi_qp_offset);
    ADD_STRING(av_enc_vmaf_calc);
    ADD_STRING(video_enc_min_scc_auto_framerate);
    ADD_STRING(av_enc_profiling);
    ADD_STRING(av_enc_param_config);
    ADD_STRING(av_enc_advanced_param_config);
    ADD_STRING(av_enc_screen_sharing_subclass);

    ADD_STRING(enable_iptos);

    ADD_STRING(key_frame_interval_intra_request);
    ADD_STRING(video_switch_soft_decoder_threshold);
    ADD_STRING(min_encode_keyframe_interval);
    ADD_STRING(bFrames);
    ADD_STRING(enable_bframe);
    ADD_STRING(video_skip_enable);
    ADD_STRING(av_enc_new_complexity);
    ADD_STRING(av_enc_default_complexity);
    ADD_STRING(av_enc_intra_key_interval);
    ADD_STRING(key_force_device_score);
    ADD_STRING(av_enc_bitrate_adjustment_type);
    ADD_STRING(use_single_slice_parser);
    ADD_STRING(enable_parser_reject);    
    
    ADD_STRING(direct_cdn_streaming_h264_profile);
    ADD_STRING(av_enc_send_sei_alpha);
    ADD_STRING(av_enc_alpha_data_codec_type);
    ADD_STRING(av_enc_alpha_data_scale_mode);
    ADD_STRING(av_enc_encode_alpha);
    ADD_STRING(enable_hw_encoder_quickly_start);
    ADD_STRING(initial_hw_encoder_quickly_start);
    ADD_STRING(fake_enc_error_code);
    ADD_STRING(enable_smooth_enc_codec_change);
    ADD_STRING(fps_est_window_size_ms);
    ADD_STRING(default_enable_hw_encoder);
    ADD_STRING(use_keyframe_type_from_parser);
    ADD_STRING(frame_glitching_detect_level);
    ADD_STRING(enable_minor_stream_codec_follow_major_stream);
    ADD_STRING(decode_key_frame_only_flag);
    ADD_STRING(av_sw_enc_rc_use_capture_time);
    ADD_STRING(feedback_mode);
    ADD_STRING(response_quick_intra_request);
#undef ADD_STRING
    std::string ret = ost.str();
    auto index = ret.rfind(",");
    if (index != ret.npos) {
      ret = ret.substr(0, index);
      ret += NEW_LINE;
    }

    return "{" NEW_LINE + ret + "}";
  }

  Optional<int> codec_type;
  Optional<int> h265_screen_enable;
  Optional<int> frame_width;
  Optional<int> frame_height;
  Optional<int> frame_rate;
  Optional<int> start_bitrate;
  Optional<int> target_bitrate;
  Optional<int> min_bitrate;
  Optional<int> max_bitrate;
  Optional<int> actual_max_bitrate;
  Optional<int> orientation_mode;
  Optional<uint8_t> number_of_temporal_layers;
  Optional<uint8_t> (number_of_bframe_temporal_layers);
  Optional<std::string> sps_data;
  Optional<std::string> pps_data;
  Optional<int> h264_profile;
  Optional<int> minor_stream_h264_profile;
  Optional<bool> adaptive_op_mode;
  Optional<uint8_t> number_of_spatial_layers;
  Optional<bool> flexible_mode;
  Optional<int> interlayer_pred;
  Optional<int> num_of_encoder_cores;
  Optional<int> degradation_preference;
  Optional<int> fps_down_step;
  Optional<int> fps_up_step;
  Optional<int> vqc_version;
  Optional<int> vqc_force_use_version;
  Optional<int> overuse_detector_version;
  //TODO(kefan) these vqc parameters should placed in MediaEngineParameterCollection
  Optional<bool> vqc_quick_adaptNetwork;
  Optional<int> vqc_min_framerate;
  Optional<std::string> vqc_settings_by_resolution;
  Optional<int> vqc_min_holdtime_auto_resize_zoomin;
  Optional<int> vqc_min_holdtime_auto_resize_zoomout;
  Optional<int> vqc_qp_adjust;
  Optional<int> vqc_ios_h265_adjust;
  Optional<int> (min_qp);
  Optional<int> (max_qp);
  Optional<int> (frame_max_size);   
  Optional<int> quick_response_intra_request;
  Optional<int> fec_method;
  Optional<int> fec_fix_rate;
  //h265 dec enable
  Optional<bool> h265_dec_enable;
  //av1 dec enable
  Optional<bool> av1_dec_enable;
  Optional<bool> av1_camera_enable;
  Optional<bool> av1_feedback_enable;
  Optional<bool> av1_screen_enable;
  Optional<int> major_stream_encoder_thread_num;
  Optional<int> minor_stream_encoder_thread_num;
  // enc scc enable
  Optional<bool> enc_scc_enable;
  // vp8 enc switch
  Optional<bool> vp8_enc_switch;
  
  Optional<int> min_enc_level;

  Optional<int> minscore_for_swh265enc;
  Optional<bool> default_enable_hwenc_win32;
  Optional<std::string> hwenc_blacklist;
  Optional<bool> enable_change_encoder_profile;
  
  Optional<bool> wz265_dec_enable;

  Optional<int> complexity;
  Optional<bool> denoising_on;
  Optional<bool> automatic_resize_on;
  Optional<bool> frame_dropping_on;
  Optional<bool> has_intra_request;
  Optional<int> key_frame_interval;
  Optional<int> entropy_coding_mode_flag;
  Optional<int> loop_filter_disable_idc;
  Optional<bool> background_detection_on;
  Optional<int> posted_frames_waiting_for_encode;
  Optional<std::string> bitrate_adjust_ratio;
  Optional<std::string> minbitrate_ratio;
  // followings are hw setting

  // h264 quality scaler settings
  Optional<bool> quality_scale_only_on_average_qp;
  Optional<int> h264_qp_thresholds_low;
  Optional<int> h264_qp_thresholds_high;
  
  Optional<int> reset_bitrate_ratio;
  Optional<int> reset_framerate_ratio;

  //vqa
  Optional<int> dec_mosreport;

  // Specifies whether or not to enable hw decode.
  Optional<bool> enable_hw_decoder;
  // Specifies whether or not to enable background hw decode.
  Optional<bool> enable_background_hw_decode;
  // Specifies hw encode provider.
  Optional<std::string> hw_decoder_provider;
  Optional<int> decoder_thread_num;

  // Specifies whether or not to enable hw encode.
  Optional<bool> enable_hw_encoder;
  Optional<bool> force_hw_encoder;
  // Specifies hw encode provider.
  Optional<uint32_t> hw_encoder_provider;
  // Specifies the encoding scheme.
  Optional<uint32_t> av_enc_codec_type;
  // Specifies the quality level for encoding.
  //    0	  Minimum quality, smaller output size.
  //    100	Maximum quality, larger output size.
  Optional<uint32_t> av_enc_common_quality;
  // Specifies the rate control mode.
  //    eAVEncCommonRateControlMode_CBR,
  //    eAVEncCommonRateControlMode_PeakConstrainedVBR,
  //    eAVEncCommonRateControlMode_UnconstrainedVBR,
  //    eAVEncCommonRateControlMode_Quality,
  //    eAVEncCommonRateControlMode_LowDelayVBR,
  //    eAVEncCommonRateControlMode_GlobalVBR,
  //    eAVEncCommonRateControlMode_GlobalLowDelayVBR
  Optional<uint32_t> av_enc_common_rate_control_mode;
  // Specifies whether the encoder uses concealment motion vectors.
  Optional<bool> enable_video_sender_frame_dropper;

  Optional<bool> enable_nvdia_first;
  Optional<int32_t> nvdia_cpu_threshold_mhz;
  Optional<int32_t> intel_cpu_threshold_mhz;
  Optional<bool> vdm_not_override_lua_smallvideo_not_use_hwenc_policy;
  Optional<bool> enable_video_qoe_assess;
  // Specifies the min resolution level to use h264 hardware encoder
  Optional<int> h264_hw_min_res_level;
  // mac slice num for a264, valid only when > 0
  Optional<int> av_enc_video_max_slices;
  // rc limit value, it can limit the fluctuation range of the bitrate
  Optional<int> video_encoder_rc_limit_value;
  Optional<int> video_encoder_rc_scene;
  Optional<int> video_encoder_impair_net_ref_opt;
  // software encoder open dump frame info feature, used to investigate questions
  Optional<int> av_sw_enc_dump_frame_info;
  Optional<bool> enable_pvc;
  Optional<int> pvc_max_support_resolution;
  Optional<bool> enable_pvc_verify;
  Optional<bool> enable_sr_verify;
  Optional<int> sr_verify_type;
  Optional<bool> enable_sr;
  Optional<int> sr_type;

  Optional<bool> JBMinDelayForRDCEnable;
  Optional<bool> enable_video_vpr;
  Optional<int32_t> video_vpr_init_size;
  Optional<int32_t> video_vpr_max_size;
  Optional<int32_t> video_vpr_frozen_ms_thres;
  Optional<int32_t> video_vpr_frozen_rate_thres;
  Optional<int32_t> video_vpr_method;
  Optional<int32_t> video_vpr_adaptive_thres;
  Optional<bool> retrans_detect_enable;
  Optional<bool> use_sent_ts_enable;
  // for intra request
  Optional<int32_t> av_enc_intra_key_interval;
  Optional<int32_t> key_force_device_score;
  Optional<int32_t> av_enc_bitrate_adjustment_type;
  Optional<int> video_rotation;
  Optional<int> scale_type;

  Optional<bool> scc_auto_framerate;
  Optional<bool> scc_quality_opt;
  Optional<bool> video_render_d3d9_texture;
  Optional<int32_t> video_render_d3d9_render_mode;
  Optional<int32_t> video_render_buffer_queue_size;
  Optional<bool> video_render_vsync_switch;
  Optional<bool> video_force_texture_to_i420;
  Optional<bool> video_windows_capture_to_texture;
  Optional<bool> video_android_capturer_copy_enable;

  Optional<bool> video_enable_high_definition_strategy;
  // whether default use a264;
  Optional<bool> av_enc_video_use_a264;
  Optional<bool> av_enc_video_enable_roi;
  Optional<int> roi_max_qp;
  Optional<int> roi_qp_offset;
  // whether open vmaf calc;
  Optional<int> av_enc_video_qp_parser_skip;
  Optional<bool> av_enc_vmaf_calc;
  // min scc auto framerate, default don't setting;
  Optional<int> video_enc_min_scc_auto_framerate;
  // whether open video coding profiling 
  Optional<bool> av_enc_profiling;
  // sw encoder param
  Optional<std::string> av_enc_param_config;
  // advanced encoder param
  Optional<std::string> av_enc_advanced_param_config;
  // screen sharing content type
  Optional<int32_t> av_enc_screen_sharing_subclass;
  Optional<int32_t> av_enc_video_width_alignment;
  Optional<int32_t> av_enc_video_height_alignment;
  Optional<std::string> av_enc_video_hwenc_config;
  Optional<std::string> av_dec_video_hwdec_config;
  Optional<int32_t> av_enc_hw_hevc_exceptions;
  Optional<int32_t> av_dec_hw_hevc_exceptions;
  Optional<int32_t> av_enc_hw_exceptions;
  Optional<int32_t> av_dec_sw_a264_enable;
  Optional<bool> av_enc_video_force_alignment;
  Optional<bool> av_enc_video_enable_dequeue_timewait;
  Optional<bool> av_enc_video_adjustment_reset;
  Optional<bool> av_dec_texture_copy_enable;
  Optional<bool> av_dec_output_byte_frame;
  Optional<int> av_dec_output_byte_frame_resolution_product_thres;
  // whether use single slice parser.
  Optional<bool> use_single_slice_parser;
  Optional<bool> color_space_enable;
  Optional<int> videoFullrange;
  Optional<int> matrixCoefficients;
  Optional<bool> enable_iptos;

  Optional<bool> save_encode_bitrate;
  Optional<bool> save_encode_bitrate_minor_stream;
  Optional<std::string> save_encode_bitrate_params;
  Optional<int> key_frame_interval_intra_request;
  Optional<int> video_switch_soft_decoder_threshold;
  Optional<int> min_encode_keyframe_interval;
  Optional<bool> video_skip_enable;
  Optional<bool> av_enc_new_complexity;
  Optional<int> av_enc_default_complexity;
  Optional<bool> enable_parser_reject;
  Optional<int> direct_cdn_streaming_h264_profile;
    
  Optional<bool> av_enc_send_sei_alpha;
  Optional<int> av_enc_alpha_data_codec_type;
  Optional<int> av_enc_alpha_data_scale_mode;
  Optional<bool> av_enc_encode_alpha;
  
  Optional<bool> enable_bframe;
  Optional<int> bFrames;
  Optional<std::string> bitrate_ceiling_ratio;
  Optional<bool> enable_hw_encoder_quickly_start;
  Optional<bool> initial_hw_encoder_quickly_start;
  Optional<int> fake_enc_error_code;
  Optional<bool> enable_smooth_enc_codec_change;
  Optional<int> fps_est_window_size_ms;
  Optional<bool> default_enable_hw_encoder;
  Optional<int> use_keyframe_type_from_parser;
  Optional<int> frame_glitching_detect_level;
  Optional<int> feedback_mode;

  // minor stream config
  Optional<bool> enable_minor_stream_intra_request;
  // Specifies whether or not to enable low stream hw encode.
  Optional<bool> low_stream_enable_hw_encoder;
  Optional<uint8_t> simulcast_stream_number_of_temporal_layers;
  Optional<bool> enable_minor_stream_codec_follow_major_stream;
  Optional<bool> decode_key_frame_only_flag;
  Optional<bool> av_sw_enc_rc_use_capture_time;
  Optional<bool> response_quick_intra_request;

 private:
  template <class T>
  std::string ToStringIfSet(const char* key, const Optional<T>& val) const {
    std::string str;
    if (val) {
      str = key;
      str = "\t\"" + str + "\"";
      str += ": ";
      str += std::to_string(*val);
      str += ",";
      str += NEW_LINE;
    }
    return str;
  }

  std::string ToStringIfSet(const char* key, const Optional<std::string>& val) const {
    std::string str;
    if (val) {
      str = key;
      str = "\t\"" + str + "\"";
      str += ": \"";
      str += val.value();
      str += "\",";
      str += NEW_LINE;
    }
    return str;
  }

  std::string ToStringIfSet(const char* key, const Optional<bool>& val) const {
    std::string str;
    if (val) {
      str = key;
      str = "\t\"" + str + "\"";
      str += ": ";
      str += *val ? "true" : "false";
      str += ",";
      str += NEW_LINE;
    }
    return str;
  }

  template <typename T>
  static void SetFrom(Optional<T>* s, const Optional<T>& o) {
    if (o) {
      *s = o;
    }
  }
};

}  // namespace rtc
}  // namespace agora
