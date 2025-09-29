//  Agora SDK
//
//  Copyright (c) 2019 Agora.io. All rights reserved.
//  Reference from WebRTC project
//
#pragma once

#include <string>

#include "AgoraOptional.h"

#define SET_FROM(X) SetFrom(&X, change.X)

#define BEGIN_COMPARE() bool b = true
#define ADD_COMPARE(X) b = (b && (X == o.X))
#define END_COMPARE_AND_RETURN() \
  ;                              \
  return b

#define UNPUBLISH(X) X.reset()

namespace agora {
namespace rtc {

/**
 * ADM Android mode
 */
enum ADM_ANDROID_MODE {
  /**
   * Java input and Java output
   * webrtc::AudioDeviceModule::kAndroidJavaAudio
   */
  JAVA_INPUT_AND_JAVA_OUTPUT = 5,
  
  /**
   * OpenSL input and OpenSL output
   * webrtc::AudioDeviceModule::kAndroidOpenSLESAudio
   */
  OPENSL_INPUT_AND_OPENSL_OUTPUT = 6,

  /**
   * Java input and OpenSL output
   * webrtc::AudioDeviceModule::kAndroidJavaInputAndOpenSLESOutputAudio
   */
  JAVA_INPUT_AND_OPENSL_OUTPUT = 7,

  /**
   * Oboe input and Oboe output
   * webrtc::AudioDeviceModule::kAndroidAAudioAudio
   */
  OBOE_INPUT_AND_OBOE_OUTPUT = 8,

  /**
   * Java input and Oboe output
   * webrtc::AudioDeviceModule::kAndroidJavaInputAndAAudioOutputAudio
   */
  JAVA_INPUT_AND_OBOE_OUTPUT = 9,
};

// Options that can be applied to an audio track or audio engine.
struct AudioOptions {
  AudioOptions() = default;
  ~AudioOptions() = default;

  void SetAecAll(const AudioOptions& change) {
    SET_FROM(apm_enable_aec);
    SET_FROM(apm_aec_nlp_size);
    SET_FROM(apm_aec_nlp_hop_size);
    SET_FROM(apm_aec_nlp_aggressiveness);
    SET_FROM(apm_aec_specify_suppression_step);
    SET_FROM(apm_aec_nlp_enable);
    SET_FROM(apm_aec_alignRefDelay);
    SET_FROM(apm_aec_complexity);
    SET_FROM(apm_aec_sw_processing_mode);
    SET_FROM(apm_aec_linear_filter_length_ms);
    SET_FROM(apm_aec_delay_search_range_ms);
    SET_FROM(apm_aec_delay_search_method);
    SET_FROM(apm_aec_fixed_delay);
    SET_FROM(apm_aec_extra_delay_bias);
    SET_FROM(adm_ext_recording_source_delay_ms);
    SET_FROM(apm_aiaec_main_switch);
    SET_FROM(apm_aec_nlp_plan);
    SET_FROM(apm_aec_saturated);
    SET_FROM(apm_aec_ainlp_profile_method);
    SET_FROM(apm_aec_ainlp_reset_period);
    SET_FROM(apm_aec_ainlp_reset_ratio);
    SET_FROM(apm_aec_ainlp_fallback_period);
    SET_FROM(apm_aec_ainlp_postprocessing_method);
    SET_FROM(apm_aec_linear_filter_type);
  }

  void SetApmAll(const AudioOptions& change) {
    SET_FROM(apm_bypass_apm);
    SET_FROM(apm_splitband_algroute);
    SET_FROM(apm_print_config_detail);
    SET_FROM(apm_enable_aec_external);
    SET_FROM(apm_enable_ns);
    SET_FROM(apm_ains_mode);
    SET_FROM(apm_ains_gain_control);
    SET_FROM(apm_ains_speech_enhance);
    SET_FROM(apm_enable_agc);
    SET_FROM(apm_enable_md);
    SET_FROM(apm_aimd_value);
    SET_FROM(apm_enable_highpass_filter);
    SET_FROM(apm_enable_tone_remover);
    SET_FROM(apm_enable_pitch_smoother);
    SET_FROM(apm_enable_howling_control);
    SET_FROM(apm_delay_offset_ms);
    SET_FROM(apm_aec_split_srate_for_32k);
    SET_FROM(apm_aec_split_srate_for_48k);
    SET_FROM(apm_agc_target_level_dbfs);
    SET_FROM(apm_agc_compression_gain_db);
    SET_FROM(apm_agc_curve_slope);
    SET_FROM(apm_agc_mode);
    SET_FROM(apm_agc_bg_opt_mode);
    SET_FROM(apm_ns_enable_ns_follow_agc);
    SET_FROM(apm_ns_level);
    SET_FROM(apm_ns_noiseGateThres);
    SET_FROM(apm_ns_complexity);
    SET_FROM(apm_enable_record_boost);
    // AINS
    SET_FROM(apm_ains_fft_size);
    SET_FROM(apm_ains_maxtolerant_ms);
    SET_FROM(apm_ains_attack_factor);
    SET_FROM(apm_ains_release_factor);
    SET_FROM(apm_ains_upper_bound);
    SET_FROM(apm_ains_upper_mask);
    SET_FROM(apm_ains_lower_bound);
    SET_FROM(apm_ains_lower_mask);
    SET_FROM(apm_nsng_end_start_up_long);
    SET_FROM(apm_nsng_end_start_up_short);
    SET_FROM(apm_nsng_quantile);
    SET_FROM(apm_nsng_noise_update_factor);
    SET_FROM(apm_nsng_speech_update_factor);
    SET_FROM(apm_nsng_overdrive);
    SET_FROM(apm_nsng_noise_ref_protect);
    SET_FROM(apm_nsng_vad_threshold);
    SET_FROM(apm_nsng_md_threshold);
    SET_FROM(apm_ains_reset_frame);
    SET_FROM(apm_ains_kill_highband);
    SET_FROM(apm_ains_triangle_1);
    SET_FROM(apm_ains_triangle_2);
    SET_FROM(apm_ains_triangle_3);
    SET_FROM(apm_ains_threshold_ai);
    SET_FROM(apm_ains_threshold_stastical);
    SET_FROM(apm_ains_enh_factor_ai);
    SET_FROM(apm_ains_enh_factor_stastical);
    SET_FROM(apm_ains_noise_over_estimate);
    SET_FROM(apm_ains_statistical_bound);
    SET_FROM(apm_ains_gain_boost_frq1);
    SET_FROM(apm_ains_gain_boost_gain1);
    SET_FROM(apm_ains_gain_boost_frq2);
    SET_FROM(apm_ains_gain_boost_gain2);
    SET_FROM(apm_ains_gain_boost_frq3);
    SET_FROM(apm_ains_gain_boost_gain3);
    SET_FROM(apm_ains_final_lower_mask);
    SET_FROM(apm_ains_noise_pow_floor);
    SET_FROM(apm_ains_cng_base_magnitude);
    SET_FROM(apm_ains_strategy);
    SET_FROM(apm_ains_postfilter_margin);
    SET_FROM(apm_ains_delaymode);
    SET_FROM(apm_ains_aggressive);
    SET_FROM(apm_farend_gain_threshold);
    SET_FROM(apm_farend_gain);
    SET_FROM(apm_process_channels);
    SET_FROM(apm_aed_enable);
    SET_FROM(apm_sf_enabled);
    SET_FROM(apm_sf_procIONSample);
    SET_FROM(apm_sf_delayMode);
    SET_FROM(apm_sf_stftType);
    SET_FROM(apm_sf_procChainMode);
    SET_FROM(apm_sf_nlpEnable);
    SET_FROM(apm_sf_nsEnable);
    SET_FROM(apm_sf_biquadEnable);
    SET_FROM(apm_sf_ainlpToLoadFlag);
    SET_FROM(apm_sf_ainlpMonitorLen);
    SET_FROM(apm_sf_ainsToLoadFlag);
    SET_FROM(apm_sf_ainsMonitorLen);
    SET_FROM(apm_sf_ainsLowLatencyFlag);
    SET_FROM(apm_sf_nlpAlgRoute);
    SET_FROM(apm_sf_nsngAlgRoute);
    SET_FROM(apm_sf_nlpFrmRemoveEngRatioThr);
    SET_FROM(apm_sf_trdNlpFrmRmvEngRatioThr);
    SET_FROM(apm_sf_nlpHbandAgg);
    SET_FROM(apm_sf_ainsKillHEBandFlag);
    SET_FROM(apm_sf_ainlpLowLatencyFlag);
    SET_FROM(apm_sf_fallBackThrRatio);
    SET_FROM(apm_sf_fallBackRefMode);
    SET_FROM(apm_sf_fallBackPref);
    SET_FROM(apm_sf_nlpNoiseAddThr);
    SET_FROM(apm_sf_nlpNoiseAddGain);
    SET_FROM(apm_sf_nlpAggressiveness);
    SET_FROM(apm_sf_nlpHeadsetAgg);
    SET_FROM(apm_sf_nlpSpkrAgg);
    SET_FROM(apm_sf_nlpDynamicMode);
    SET_FROM(apm_sf_ainlpHotResetFrq);
    SET_FROM(apm_sf_ainlpHotResetFactor);
    SET_FROM(apm_sf_ainlpMonitorQuantile);
    SET_FROM(apm_sf_nsngPredefAgg);
    SET_FROM(apm_sf_nsngMusicProbThr);
    SET_FROM(apm_sf_nsngMusicModeBackoffDB);
    SET_FROM(apm_sf_statNsEnhFactor);
    SET_FROM(apm_sf_statNsNoiseOverEst);
    SET_FROM(apm_sf_statNsOverDrive);
    SET_FROM(apm_sf_statNsLowerBound);
    SET_FROM(apm_sf_statNsSpchUpdateRadix);
    SET_FROM(apm_sf_statNsNoiseUpdateRadix);
    SET_FROM(apm_sf_statNsEndStartupShort);
    SET_FROM(apm_sf_statNsEndStartupLong);
    SET_FROM(apm_sf_statNsNoiseUpdateQuantile);
    SET_FROM(apm_sf_nsngMapInMaskMin);
    SET_FROM(apm_sf_nsngMapOutMaskMin);
    SET_FROM(apm_sf_nsngFinalMaskLowerBound);
    SET_FROM(apm_sf_nsngPfMargin);
    SET_FROM(apm_sf_ainsHotResetFrq);
    SET_FROM(apm_sf_ainsMonitorQuantile);
    SET_FROM(apm_sf_nsngAuxToolsMode);
    SET_FROM(apm_sf_nlpProcBand);
    SET_FROM(apm_sf_nsProcBand);
    SET_FROM(apm_sf_ainsModelPref);
    SET_FROM(apm_sf_ainlpModelPref);
    //vsc
    SET_FROM(apm_vsc_enabled);
    SET_FROM(apm_vsc_gender);
    SET_FROM(apm_vsc_effect);
    SET_FROM(apm_vsc_selfConfig);
    SET_FROM(apm_vsc_preset);
    SET_FROM(apm_vsc_gain);
  }

  void SetAll(const AudioOptions& change) {
    SetAecAll(change);
    SetApmAll(change);

    SET_FROM(audio_scenario);
    SET_FROM(audio_routing);
    SET_FROM(input_audio_routing);
    SET_FROM(adm_android_mode);
    SET_FROM(adm_enable_estimated_device_delay);
    SET_FROM(audio_channel_profile);
    SET_FROM(audio_routing_version);
    SET_FROM(adm_estimate_device_loopback_delay_with_aec);
    SET_FROM(adm_enable_lowlatency_capture);
    SET_FROM(adm_enable_lowlatency_playout);
    SET_FROM(adm_capture_io_buffer_ms);
    SET_FROM(adm_force_layer);
    SET_FROM(adm_duck_others);
    SET_FROM(adm_mix_with_others);
    SET_FROM(adm_restart_when_interrupted);
    SET_FROM(adm_enable_fallback);
    SET_FROM(adm_specify_category);
    SET_FROM(adm_record_audio_session_call_stack);
    SET_FROM(adm_allow_haptics_during_record);
    SET_FROM(has_remote_peers);
    SET_FROM(has_enabled_ear_monitor);
    SET_FROM(adm_input_sample_rate);
    SET_FROM(adm_output_sample_rate);
    SET_FROM(adm_enable_exclusive_mode);
    SET_FROM(adm_input_channels);
    SET_FROM(adm_output_channels);
    SET_FROM(adm_has_recorded);
    SET_FROM(external_adm_has_recorded);
    SET_FROM(adm_enable_mic_selection);
    SET_FROM(adm_force_use_bluetooth_a2dp);
    SET_FROM(adm_use_bluetooth_hfp);
    SET_FROM(adm_use_hw_aec);
    SET_FROM(adm_force_restart);
    SET_FROM(adm_microphone_preference);
    SET_FROM(adm_speaker_balance);
    SET_FROM(adm_audio_layer);
    SET_FROM(adm_audio_source);
    SET_FROM(adm_playout_bufsize_factor);
    SET_FROM(adm_enable_builtin3a);
    SET_FROM(adm_extra_playout_latency);
    SET_FROM(adm_extra_record_latency);
    SET_FROM(adm_opensl_output_bufs);
    SET_FROM(adm_opensl_input_bufs);
    SET_FROM(adm_bypass_vpio_processing);
    SET_FROM(adm_enable_async_process);
    SET_FROM(adm_ducking_option_advanced);
    SET_FROM(adm_ducking_option_level);
    SET_FROM(adm_ears_monitor_channels);
    SET_FROM(uplink_apm_async_process);
    SET_FROM(only_report_microphone_volume);
    SET_FROM(enable_multi_drive_apparatus);
    SET_FROM(enable_stereo_playout);
    SET_FROM(enable_concurrent_downlink_processing);
    SET_FROM(mute_playout_signal);
    SET_FROM(onmix_callback_with_external_source);
    SET_FROM(enable_muted_talker_detection);
    SET_FROM(enable_receiver_apm);
    SET_FROM(downlink_peq_enable);
    SET_FROM(uplink_voice_over_enable);
    SET_FROM(downlink_voice_over_enable);
    SET_FROM(adm_win_recording_device_buffer_ms);
    SET_FROM(adm_windows_layer_with_waveapi);
    SET_FROM(adm_windows_bypass_system_render_apo);
    SET_FROM(adm_windows_enable_microphone_boost);
    SET_FROM(adm_aggregate_playout_device_volume_control);
    SET_FROM(adm_microphone_volume_init_state);
    SET_FROM(adm_mac_use_audio_unit_hal);
    SET_FROM(adm_mac_allow_virtual_recording_device);
    SET_FROM(adm_mac_allow_virtual_playout_device);
    SET_FROM(acm_bitrate);
    SET_FROM(acm_codec);
    SET_FROM(acm_dtx);
    SET_FROM(acm_plc);
    SET_FROM(acm_complex_level);
    SET_FROM(acm_ptime);
    SET_FROM(acm_hw_encode_opus);
    SET_FROM(acm_hw_decode_opus);
    SET_FROM(acm_opus_celt_only);
    SET_FROM(acm_opus_max_encoded_bytes);
    SET_FROM(acm_opus_voice_threshold);
    SET_FROM(acm_opus_enable_volume_based_bitrate_reduction);
    SET_FROM(acm_opus_voice_up_coef);
    SET_FROM(acm_opus_voice_down_coef);
    SET_FROM(acm_opus_voice_hold_window_ms);
    SET_FROM(acm_opus_silence_bitrate);
    SET_FROM(audio_resend);
    SET_FROM(enable_adaptable_fix_rsfec);
    SET_FROM(audio_rsfec_frame_num);
    SET_FROM(audio_rsfec_interleave_num);
    SET_FROM(audio_fec_frame_num);
    SET_FROM(audio_fec_interleave_num);
    SET_FROM(neteq_live_min_delay);
    SET_FROM(neteq_jitter_buffer_max_packets);
    SET_FROM(neteq_jitter_buffer_fast_accelerate);
    SET_FROM(neteq_jitter_max_target_delay);
    SET_FROM(neteq_filter_target_loss);
    SET_FROM(neteq_max_filter_window);
    SET_FROM(neteq_acceleration_percent);
    SET_FROM(neteq_deceleration_percent);
    SET_FROM(neteq_scretch_threshold_percent);
    SET_FROM(neteq_unvoice_accelerate_percent);
    SET_FROM(neteq_max_wait_ms);
    SET_FROM(neteq_max_wait_first_decode_ms);
    SET_FROM(neteq_enable_time_stretching);
    SET_FROM(neteq_enable_expired_peak_detector);
    SET_FROM(neteq_enable_peak_detector);
    SET_FROM(neteq_enable_muted_state);
    SET_FROM(neteq_max_exceed_time_ms);
    SET_FROM(neteq_max_filter_dup_num);
    SET_FROM(neteq_enable_voice_volume_level);
    SET_FROM(neteq_enable_individuality_delay);
    SET_FROM(neteq_enable_improve_burst);
    SET_FROM(neteq_max_mute_duration_ms);
    SET_FROM(neteq_low_latency_burst_control_window_ms);
    SET_FROM(neteq_low_latency_burst_control_platform_ms);
    SET_FROM(neteq_low_latency_burst_peak_num_threshold);
    SET_FROM(neteq_low_latency_burst_trend_threshold);
    SET_FROM(neteq_low_latency_burst_peak_trend_increased_threshold);
    SET_FROM(neteq_low_latency_burst_overuse_limited_quantile);
    SET_FROM(neteq_low_latency_burst_comb_window_second);
    SET_FROM(neteq_low_latency_burst_max_jitter_limit_ms);
    SET_FROM(neteq_high_latency_burst_control_window_ms);
    SET_FROM(neteq_high_latency_burst_control_platform_ms);
    SET_FROM(neteq_high_latency_burst_peak_num_threshold);
    SET_FROM(neteq_high_latency_burst_trend_threshold);
    SET_FROM(neteq_high_latency_burst_peak_trend_increased_threshold);
    SET_FROM(neteq_high_latency_burst_overuse_limited_quantile);
    SET_FROM(neteq_high_latency_burst_comb_window_second);
    SET_FROM(neteq_high_latency_burst_max_jitter_limit_ms);
    SET_FROM(neteq_freeze_m);
    SET_FROM(neteq_freeze_n);
    SET_FROM(neteq_targetlevel_offset);
    SET_FROM(neteq_enable_stable_playout);
    SET_FROM(neteq_drop_window_threshold_ms);
    SET_FROM(neteq_drop_distance_threshold_ms);
    SET_FROM(neteq_prebuffer_window_threshold_ms);
    SET_FROM(neteq_prebuffer_distance_threshold_ms);
    SET_FROM(neteq_max_packets_stable_playout);
    SET_FROM(neteq_normal_recv_rate_ratio_threshold);
    SET_FROM(neteq_target_level_optimization);
    SET_FROM(neteq_aqm_voice_threshold);
    SET_FROM(neteq_dump_level);
    SET_FROM(neteq_dump_path);
    SET_FROM(neteq_limit_prob);
    SET_FROM(neteq_pre_dump);
    SET_FROM(neteq_lower_limit_probability);
    SET_FROM(neteq_plc_mode);
    SET_FROM(neteq_outlier_detector);
    SET_FROM(dwlink_gain);
    SET_FROM(uplink_gain);
    SET_FROM(adm_separate_audio_unit);
    SET_FROM(derived_headset_black_list_device);
    SET_FROM(use_media_volume_in_headset);
    SET_FROM(use_media_volume_in_audience);
    SET_FROM(use_media_volume_in_solo);
    SET_FROM(use_media_volume_in_bluetooth);
    SET_FROM(enable_audio_label);
  }

  bool operator==(const AudioOptions& o) const {
    BEGIN_COMPARE();
    ADD_COMPARE(audio_scenario);
    ADD_COMPARE(audio_routing);
    ADD_COMPARE(input_audio_routing);
    ADD_COMPARE(adm_android_mode);
    ADD_COMPARE(adm_enable_estimated_device_delay);
    ADD_COMPARE(audio_channel_profile);
    ADD_COMPARE(audio_routing_version);
    ADD_COMPARE(adm_estimate_device_loopback_delay_with_aec);
    ADD_COMPARE(adm_enable_lowlatency_capture);
    ADD_COMPARE(adm_enable_lowlatency_playout);
    ADD_COMPARE(adm_capture_io_buffer_ms);
    ADD_COMPARE(adm_force_layer);
    ADD_COMPARE(adm_duck_others);
    ADD_COMPARE(adm_mix_with_others);
    ADD_COMPARE(adm_restart_when_interrupted);
    ADD_COMPARE(adm_enable_fallback);
    ADD_COMPARE(adm_specify_category);
    ADD_COMPARE(adm_record_audio_session_call_stack);
    ADD_COMPARE(adm_allow_haptics_during_record);
    ADD_COMPARE(has_remote_peers);
    ADD_COMPARE(has_enabled_ear_monitor);
    ADD_COMPARE(adm_input_sample_rate);
    ADD_COMPARE(adm_output_sample_rate);
    ADD_COMPARE(adm_enable_exclusive_mode);
    ADD_COMPARE(adm_input_channels);
    ADD_COMPARE(adm_output_channels);
    ADD_COMPARE(adm_has_recorded);
    ADD_COMPARE(external_adm_has_recorded);
    ADD_COMPARE(adm_enable_mic_selection);
    ADD_COMPARE(adm_force_use_bluetooth_a2dp);
    ADD_COMPARE(adm_use_bluetooth_hfp);
    ADD_COMPARE(adm_use_hw_aec);
    ADD_COMPARE(adm_force_restart);
    ADD_COMPARE(adm_microphone_preference);
    ADD_COMPARE(adm_speaker_balance);
    ADD_COMPARE(adm_audio_layer);
    ADD_COMPARE(adm_audio_source);
    ADD_COMPARE(adm_playout_bufsize_factor);
    ADD_COMPARE(adm_enable_builtin3a);
    ADD_COMPARE(uplink_apm_async_process);
    ADD_COMPARE(only_report_microphone_volume);
    ADD_COMPARE(enable_multi_drive_apparatus);
    ADD_COMPARE(enable_stereo_playout);
    ADD_COMPARE(enable_concurrent_downlink_processing);
    ADD_COMPARE(mute_playout_signal);
    ADD_COMPARE(onmix_callback_with_external_source);
    ADD_COMPARE(enable_muted_talker_detection);
    ADD_COMPARE(enable_receiver_apm);
    ADD_COMPARE(downlink_peq_enable);
    ADD_COMPARE(uplink_voice_over_enable);
    ADD_COMPARE(downlink_voice_over_enable);
    ADD_COMPARE(adm_extra_playout_latency);
    ADD_COMPARE(adm_extra_record_latency);
    ADD_COMPARE(adm_opensl_output_bufs);
    ADD_COMPARE(adm_opensl_input_bufs);
    ADD_COMPARE(adm_bypass_vpio_processing);
    ADD_COMPARE(adm_enable_async_process);
    ADD_COMPARE(adm_ducking_option_advanced);
    ADD_COMPARE(adm_ducking_option_level);
    ADD_COMPARE(adm_ears_monitor_channels);
    ADD_COMPARE(apm_process_channels);
    ADD_COMPARE(apm_bypass_apm);
    ADD_COMPARE(apm_splitband_algroute);
    ADD_COMPARE(apm_print_config_detail);
    ADD_COMPARE(apm_enable_aec);
    ADD_COMPARE(apm_enable_aec_external);
    ADD_COMPARE(apm_aec_nlp_size);
    ADD_COMPARE(apm_aec_nlp_hop_size);
    ADD_COMPARE(apm_aec_delay_search_range_ms);
    ADD_COMPARE(apm_aec_delay_search_method);
    ADD_COMPARE(apm_aec_fixed_delay);
    ADD_COMPARE(apm_aec_extra_delay_bias);
    ADD_COMPARE(adm_ext_recording_source_delay_ms);
    ADD_COMPARE(apm_aiaec_main_switch);
    ADD_COMPARE(apm_aec_nlp_plan);
    ADD_COMPARE(apm_aec_saturated);
    ADD_COMPARE(apm_aec_ainlp_profile_method);
    ADD_COMPARE(apm_aec_ainlp_reset_period);
    ADD_COMPARE(apm_aec_ainlp_reset_ratio);
    ADD_COMPARE(apm_aec_ainlp_fallback_period);
    ADD_COMPARE(apm_aec_ainlp_postprocessing_method);
    ADD_COMPARE(apm_aec_linear_filter_type);
    ADD_COMPARE(apm_enable_ns);
    ADD_COMPARE(apm_ains_mode);
    ADD_COMPARE(apm_ains_gain_control);
    ADD_COMPARE(apm_ains_speech_enhance);
    // AINS
    ADD_COMPARE(apm_ains_fft_size);
    ADD_COMPARE(apm_ains_maxtolerant_ms);
    ADD_COMPARE(apm_ains_attack_factor);
    ADD_COMPARE(apm_ains_release_factor);
    ADD_COMPARE(apm_ains_upper_bound);
    ADD_COMPARE(apm_ains_upper_mask);
    ADD_COMPARE(apm_ains_lower_bound);
    ADD_COMPARE(apm_ains_lower_mask);
    ADD_COMPARE(apm_nsng_end_start_up_long);
    ADD_COMPARE(apm_nsng_end_start_up_short);
    ADD_COMPARE(apm_nsng_quantile);
    ADD_COMPARE(apm_nsng_noise_update_factor);
    ADD_COMPARE(apm_nsng_speech_update_factor);
    ADD_COMPARE(apm_nsng_overdrive);
    ADD_COMPARE(apm_nsng_noise_ref_protect);
    ADD_COMPARE(apm_nsng_vad_threshold);
    ADD_COMPARE(apm_nsng_md_threshold);
    ADD_COMPARE(apm_ains_reset_frame);
    ADD_COMPARE(apm_ains_kill_highband);
    ADD_COMPARE(apm_ains_triangle_1);
    ADD_COMPARE(apm_ains_triangle_2);
    ADD_COMPARE(apm_ains_triangle_3);
    ADD_COMPARE(apm_ains_threshold_ai);
    ADD_COMPARE(apm_ains_threshold_stastical);
    ADD_COMPARE(apm_ains_enh_factor_ai);
    ADD_COMPARE(apm_ains_enh_factor_stastical);
    ADD_COMPARE(apm_ains_noise_over_estimate);
    ADD_COMPARE(apm_ains_statistical_bound);
    ADD_COMPARE(apm_ains_gain_boost_frq1);
    ADD_COMPARE(apm_ains_gain_boost_gain1);
    ADD_COMPARE(apm_ains_gain_boost_frq2);
    ADD_COMPARE(apm_ains_gain_boost_gain2);
    ADD_COMPARE(apm_ains_gain_boost_frq3);
    ADD_COMPARE(apm_ains_gain_boost_gain3);
    ADD_COMPARE(apm_ains_final_lower_mask);
    ADD_COMPARE(apm_ains_noise_pow_floor);
    ADD_COMPARE(apm_ains_cng_base_magnitude);
    ADD_COMPARE(apm_ains_strategy);
    ADD_COMPARE(apm_ains_postfilter_margin);
    ADD_COMPARE(apm_ains_delaymode);
    ADD_COMPARE(apm_ains_aggressive);
    ADD_COMPARE(apm_farend_gain_threshold);
    ADD_COMPARE(adm_win_recording_device_buffer_ms);
    ADD_COMPARE(adm_windows_layer_with_waveapi);
    ADD_COMPARE(adm_windows_bypass_system_render_apo);
    ADD_COMPARE(adm_windows_enable_microphone_boost);
    ADD_COMPARE(adm_aggregate_playout_device_volume_control);
    ADD_COMPARE(adm_microphone_volume_init_state);
    ADD_COMPARE(adm_mac_use_audio_unit_hal);
    ADD_COMPARE(adm_mac_allow_virtual_recording_device);
    ADD_COMPARE(adm_mac_allow_virtual_playout_device);
    ADD_COMPARE(apm_farend_gain);
    ADD_COMPARE(apm_enable_agc);
    ADD_COMPARE(apm_enable_md);
    ADD_COMPARE(apm_aimd_value);
    ADD_COMPARE(apm_enable_highpass_filter);
    ADD_COMPARE(apm_enable_tone_remover);
    ADD_COMPARE(apm_enable_pitch_smoother);
    ADD_COMPARE(apm_enable_howling_control);
    ADD_COMPARE(apm_delay_offset_ms);
    ADD_COMPARE(apm_aec_nlp_aggressiveness);
    ADD_COMPARE(apm_aec_specify_suppression_step);
    ADD_COMPARE(apm_aec_complexity);
    ADD_COMPARE(apm_aec_sw_processing_mode);
    ADD_COMPARE(apm_aec_linear_filter_length_ms);
    ADD_COMPARE(apm_aec_split_srate_for_32k);
    ADD_COMPARE(apm_aec_split_srate_for_48k);
    ADD_COMPARE(apm_agc_target_level_dbfs);
    ADD_COMPARE(apm_agc_compression_gain_db);
    ADD_COMPARE(apm_agc_curve_slope);
    ADD_COMPARE(apm_agc_mode);
    ADD_COMPARE(apm_agc_bg_opt_mode);
    ADD_COMPARE(apm_aec_nlp_enable);
    ADD_COMPARE(apm_aec_alignRefDelay);
    ADD_COMPARE(apm_aed_enable);
    ADD_COMPARE(apm_sf_enabled);
    ADD_COMPARE(apm_sf_procIONSample);
    ADD_COMPARE(apm_sf_delayMode);
    ADD_COMPARE(apm_sf_stftType);
    ADD_COMPARE(apm_sf_procChainMode);
    ADD_COMPARE(apm_sf_nlpEnable);
    ADD_COMPARE(apm_sf_nsEnable);
    ADD_COMPARE(apm_sf_biquadEnable);
    ADD_COMPARE(apm_sf_ainlpToLoadFlag);
    ADD_COMPARE(apm_sf_ainlpMonitorLen);
    ADD_COMPARE(apm_sf_ainsToLoadFlag);
    ADD_COMPARE(apm_sf_ainsMonitorLen);
    ADD_COMPARE(apm_sf_ainsLowLatencyFlag);
    ADD_COMPARE(apm_sf_nlpAlgRoute);
    ADD_COMPARE(apm_sf_nsngAlgRoute);
    ADD_COMPARE(apm_sf_nlpFrmRemoveEngRatioThr);
    ADD_COMPARE(apm_sf_trdNlpFrmRmvEngRatioThr);
    ADD_COMPARE(apm_sf_nlpHbandAgg);
    ADD_COMPARE(apm_sf_ainsKillHEBandFlag);
    ADD_COMPARE(apm_sf_ainlpLowLatencyFlag);
    ADD_COMPARE(apm_sf_fallBackThrRatio);
    ADD_COMPARE(apm_sf_fallBackRefMode);
    ADD_COMPARE(apm_sf_fallBackPref);
    ADD_COMPARE(apm_sf_nlpNoiseAddThr);
    ADD_COMPARE(apm_sf_nlpNoiseAddGain);
    ADD_COMPARE(apm_sf_nlpAggressiveness);
    ADD_COMPARE(apm_sf_nlpHeadsetAgg);
    ADD_COMPARE(apm_sf_nlpSpkrAgg);
    ADD_COMPARE(apm_sf_nlpDynamicMode);
    ADD_COMPARE(apm_sf_ainlpHotResetFrq);
    ADD_COMPARE(apm_sf_ainlpHotResetFactor);
    ADD_COMPARE(apm_sf_ainlpMonitorQuantile);
    ADD_COMPARE(apm_sf_nsngPredefAgg);
    ADD_COMPARE(apm_sf_nsngMusicProbThr);
    ADD_COMPARE(apm_sf_nsngMusicModeBackoffDB);
    ADD_COMPARE(apm_sf_statNsEnhFactor);
    ADD_COMPARE(apm_sf_statNsNoiseOverEst);
    ADD_COMPARE(apm_sf_statNsOverDrive);
    ADD_COMPARE(apm_sf_statNsLowerBound);
    ADD_COMPARE(apm_sf_statNsSpchUpdateRadix);
    ADD_COMPARE(apm_sf_statNsNoiseUpdateRadix);
    ADD_COMPARE(apm_sf_statNsEndStartupShort);
    ADD_COMPARE(apm_sf_statNsEndStartupLong);
    ADD_COMPARE(apm_sf_statNsNoiseUpdateQuantile);
    ADD_COMPARE(apm_sf_nsngMapInMaskMin);
    ADD_COMPARE(apm_sf_nsngMapOutMaskMin);
    ADD_COMPARE(apm_sf_nsngFinalMaskLowerBound);
    ADD_COMPARE(apm_sf_nsngPfMargin);
    ADD_COMPARE(apm_sf_ainsHotResetFrq);
    ADD_COMPARE(apm_sf_ainsMonitorQuantile);
    ADD_COMPARE(apm_sf_nsngAuxToolsMode);
    ADD_COMPARE(apm_sf_nlpProcBand);
    ADD_COMPARE(apm_sf_nsProcBand);
    ADD_COMPARE(apm_sf_ainsModelPref);
    ADD_COMPARE(apm_sf_ainlpModelPref);
    ADD_COMPARE(apm_vsc_enabled);
    ADD_COMPARE(apm_vsc_gender);
    ADD_COMPARE(apm_vsc_effect);
    ADD_COMPARE(apm_vsc_selfConfig);
    ADD_COMPARE(apm_vsc_preset);
    ADD_COMPARE(apm_vsc_gain);
    ADD_COMPARE(apm_ns_enable_ns_follow_agc);
    ADD_COMPARE(apm_ns_level);
    ADD_COMPARE(apm_ns_noiseGateThres);
    ADD_COMPARE(apm_ns_complexity);
    ADD_COMPARE(apm_enable_record_boost);
    ADD_COMPARE(acm_bitrate);
    ADD_COMPARE(acm_codec);
    ADD_COMPARE(acm_dtx);
    ADD_COMPARE(acm_plc);
    ADD_COMPARE(acm_complex_level);
    ADD_COMPARE(acm_ptime);
    ADD_COMPARE(acm_hw_encode_opus);
    ADD_COMPARE(acm_hw_decode_opus);
    ADD_COMPARE(acm_opus_celt_only);
    ADD_COMPARE(acm_opus_max_encoded_bytes);
    ADD_COMPARE(acm_opus_voice_threshold);
    ADD_COMPARE(acm_opus_enable_volume_based_bitrate_reduction);
    ADD_COMPARE(acm_opus_voice_up_coef);
    ADD_COMPARE(acm_opus_voice_down_coef);
    ADD_COMPARE(acm_opus_voice_hold_window_ms);
    ADD_COMPARE(acm_opus_silence_bitrate);
    ADD_COMPARE(audio_resend);
    ADD_COMPARE(audio_rsfec_frame_num);
    ADD_COMPARE(enable_adaptable_fix_rsfec);
    ADD_COMPARE(audio_rsfec_interleave_num);
    ADD_COMPARE(audio_fec_frame_num);
    ADD_COMPARE(audio_fec_interleave_num);
    ADD_COMPARE(neteq_live_min_delay);
    ADD_COMPARE(neteq_jitter_buffer_max_packets);
    ADD_COMPARE(neteq_jitter_buffer_fast_accelerate);
    ADD_COMPARE(neteq_jitter_max_target_delay);
    ADD_COMPARE(neteq_filter_target_loss);
    ADD_COMPARE(neteq_max_filter_window);
    ADD_COMPARE(neteq_acceleration_percent);
    ADD_COMPARE(neteq_deceleration_percent);
    ADD_COMPARE(neteq_scretch_threshold_percent);
    ADD_COMPARE(neteq_unvoice_accelerate_percent);
    ADD_COMPARE(neteq_max_wait_ms);
    ADD_COMPARE(neteq_max_wait_first_decode_ms);
    ADD_COMPARE(neteq_enable_time_stretching);
    ADD_COMPARE(neteq_enable_expired_peak_detector);
    ADD_COMPARE(neteq_enable_peak_detector);
    ADD_COMPARE(neteq_enable_muted_state);
    ADD_COMPARE(neteq_max_exceed_time_ms);
    ADD_COMPARE(neteq_max_filter_dup_num);
    ADD_COMPARE(neteq_enable_voice_volume_level);
    ADD_COMPARE(neteq_enable_individuality_delay);
    ADD_COMPARE(neteq_enable_improve_burst);
    ADD_COMPARE(neteq_max_mute_duration_ms);
    ADD_COMPARE(neteq_low_latency_burst_control_window_ms);
    ADD_COMPARE(neteq_low_latency_burst_control_platform_ms);
    ADD_COMPARE(neteq_low_latency_burst_peak_num_threshold);
    ADD_COMPARE(neteq_low_latency_burst_trend_threshold);
    ADD_COMPARE(neteq_low_latency_burst_peak_trend_increased_threshold);
    ADD_COMPARE(neteq_low_latency_burst_overuse_limited_quantile);
    ADD_COMPARE(neteq_low_latency_burst_comb_window_second);
    ADD_COMPARE(neteq_low_latency_burst_max_jitter_limit_ms);
    ADD_COMPARE(neteq_high_latency_burst_control_window_ms);
    ADD_COMPARE(neteq_high_latency_burst_control_platform_ms);
    ADD_COMPARE(neteq_high_latency_burst_peak_num_threshold);
    ADD_COMPARE(neteq_high_latency_burst_trend_threshold);
    ADD_COMPARE(neteq_high_latency_burst_peak_trend_increased_threshold);
    ADD_COMPARE(neteq_high_latency_burst_overuse_limited_quantile);
    ADD_COMPARE(neteq_high_latency_burst_comb_window_second);
    ADD_COMPARE(neteq_high_latency_burst_max_jitter_limit_ms);
    ADD_COMPARE(neteq_freeze_m);
    ADD_COMPARE(neteq_freeze_n);
    ADD_COMPARE(neteq_targetlevel_offset);
    ADD_COMPARE(neteq_enable_stable_playout);
    ADD_COMPARE(neteq_drop_window_threshold_ms);
    ADD_COMPARE(neteq_drop_distance_threshold_ms);
    ADD_COMPARE(neteq_prebuffer_window_threshold_ms);
    ADD_COMPARE(neteq_prebuffer_distance_threshold_ms);
    ADD_COMPARE(neteq_max_packets_stable_playout);
    ADD_COMPARE(neteq_normal_recv_rate_ratio_threshold);
    ADD_COMPARE(neteq_target_level_optimization);
    ADD_COMPARE(neteq_aqm_voice_threshold);
    ADD_COMPARE(neteq_dump_level);
    ADD_COMPARE(neteq_dump_path);
    ADD_COMPARE(neteq_limit_prob);
    ADD_COMPARE(neteq_pre_dump);
    ADD_COMPARE(neteq_lower_limit_probability);
    ADD_COMPARE(neteq_plc_mode);
    ADD_COMPARE(neteq_outlier_detector);
    ADD_COMPARE(dwlink_gain);
    ADD_COMPARE(uplink_gain);
    ADD_COMPARE(adm_separate_audio_unit);
    ADD_COMPARE(derived_headset_black_list_device);
    ADD_COMPARE(use_media_volume_in_headset);
    ADD_COMPARE(use_media_volume_in_audience);
    ADD_COMPARE(use_media_volume_in_solo);
    ADD_COMPARE(use_media_volume_in_bluetooth);
    ADD_COMPARE(enable_audio_label);
    END_COMPARE_AND_RETURN();
  }

  AudioOptions& Filter() {
    UNPUBLISH(derived_headset_black_list_device);
    return *this;
  }

  bool operator!=(const AudioOptions& o) const { return !(*this == o); }

  Optional<uint32_t> audio_scenario;  // agora::rtc::AUDIO_SCENARIO_TYPE
  Optional<uint32_t> audio_routing;  // agora::rtc::AudioRoute
  Optional<int32_t> input_audio_routing;
  Optional<uint32_t> adm_android_mode;  // agora::rtc::ADM_ANDROID_MODE
  Optional<bool> adm_enable_estimated_device_delay;
  Optional<uint32_t> audio_channel_profile;
  Optional<int32_t>audio_routing_version;
  Optional<bool> adm_estimate_device_loopback_delay_with_aec;
  Optional<bool> adm_enable_lowlatency_capture;
  Optional<bool> adm_enable_lowlatency_playout;
  Optional<int32_t> adm_capture_io_buffer_ms;
  Optional<int32_t> adm_force_layer;
  Optional<bool> adm_duck_others;
  // ios::AVAudioSessionCategoryOptionMixWithOthers
  Optional<bool> adm_mix_with_others;
  Optional<bool> adm_restart_when_interrupted;
  Optional<bool> adm_enable_fallback;
  Optional<int> adm_specify_category;
  Optional<bool> adm_record_audio_session_call_stack;
  Optional<bool> adm_allow_haptics_during_record;
  Optional<bool> has_remote_peers;
  Optional<bool> has_enabled_ear_monitor;
  Optional<uint32_t> adm_input_sample_rate;
  Optional<uint32_t> adm_output_sample_rate;
  Optional<bool> adm_enable_exclusive_mode;
  Optional<uint32_t> adm_input_channels;
  Optional<uint32_t> adm_output_channels;
  Optional<bool> adm_has_recorded;
  Optional<bool> external_adm_has_recorded;
  Optional<bool> adm_enable_mic_selection;
  // ios::AVAudioSessionCategoryOptionAllowBluetoothA2DP
  Optional<bool> adm_force_use_bluetooth_a2dp;
  Optional<bool> adm_use_bluetooth_hfp;
  Optional<bool> adm_use_hw_aec;
  Optional<bool> adm_force_restart;
  Optional<int> adm_microphone_preference;  // for android
  Optional<int> adm_speaker_balance;
  Optional<uint32_t> adm_audio_layer;
  Optional<uint32_t> adm_audio_source;  // for android
  Optional<uint32_t> adm_playout_bufsize_factor;  // for android
  Optional<bool> adm_enable_builtin3a;
  
  Optional<bool> uplink_apm_async_process;
  Optional<bool> only_report_microphone_volume;
  Optional<int32_t> enable_multi_drive_apparatus;
  Optional<bool> enable_stereo_playout;
  Optional<bool> enable_concurrent_downlink_processing;
  Optional<bool> mute_playout_signal;
  Optional<bool> onmix_callback_with_external_source;
  Optional<bool> enable_muted_talker_detection;
  Optional<bool> enable_receiver_apm;
  Optional<bool> downlink_peq_enable;
  Optional<bool> uplink_voice_over_enable;
  Optional<bool> downlink_voice_over_enable;

  Optional<int> adm_extra_playout_latency; // for android
  Optional<int> adm_extra_record_latency; // for android
  Optional<int> adm_opensl_output_bufs;
  Optional<int> adm_opensl_input_bufs;
  Optional<bool> adm_bypass_vpio_processing;
  Optional<bool> adm_enable_async_process;
  Optional<bool> adm_ducking_option_advanced;
  Optional<int> adm_ducking_option_level;
  Optional<int> adm_ears_monitor_channels;
  Optional<int> apm_process_channels;  // agora::media::base::AUDIO_PROCESS_CHANNELS
  Optional<bool> apm_bypass_apm;
  Optional<int> apm_splitband_algroute;
  Optional<bool> apm_print_config_detail;
  Optional<bool> apm_enable_aec;
  Optional<bool> apm_enable_aec_external;
  Optional<int> apm_aiaec_main_switch;
  Optional<int> apm_aec_nlp_plan;
  Optional<bool> apm_aec_saturated;
  Optional<int> apm_aec_nlp_size;
  Optional<int> apm_aec_nlp_hop_size;
  Optional<int> apm_aec_delay_search_range_ms;
  Optional<int> apm_aec_delay_search_method;
  Optional<int> apm_aec_fixed_delay;
  Optional<int> apm_aec_extra_delay_bias;
  Optional<int> adm_ext_recording_source_delay_ms;
  Optional<int> apm_aec_ainlp_profile_method;
  Optional<int> apm_aec_ainlp_reset_period;
  Optional<int> apm_aec_ainlp_reset_ratio;
  Optional<int> apm_aec_ainlp_fallback_period;
  Optional<int> apm_aec_ainlp_postprocessing_method;
  Optional<int> apm_aec_linear_filter_type;
  Optional<bool> apm_enable_ns;
  Optional<int> apm_ains_mode;
  Optional<int> apm_ains_gain_control;
  Optional<int> apm_ains_speech_enhance;
  Optional<bool> apm_enable_agc;
  Optional<bool> apm_enable_md;
  Optional<int> apm_aimd_value;
  Optional<bool> apm_enable_highpass_filter;
  Optional<bool> apm_enable_tone_remover;
  Optional<bool> apm_enable_pitch_smoother;
  Optional<bool> apm_enable_howling_control;
  Optional<uint32_t> apm_delay_offset_ms;
  Optional<int32_t> apm_aec_nlp_aggressiveness;
  Optional<int32_t> apm_aec_specify_suppression_step;
  Optional<int32_t> apm_aec_complexity;
  Optional<int32_t> apm_aec_sw_processing_mode;
  Optional<int32_t> apm_aec_linear_filter_length_ms;
  Optional<int32_t> apm_aec_split_srate_for_32k;
  Optional<int32_t> apm_aec_split_srate_for_48k;
  Optional<uint32_t> apm_agc_target_level_dbfs;
  Optional<uint32_t> apm_agc_compression_gain_db;
  Optional<uint32_t> apm_agc_curve_slope;
  Optional<uint32_t> apm_agc_mode;
  Optional<uint32_t> apm_agc_bg_opt_mode;
  Optional<bool> apm_aec_nlp_enable;
  Optional<bool> apm_aec_alignRefDelay;
  Optional<int> apm_aed_enable;
  Optional<bool> apm_sf_enabled;
  Optional<int> apm_sf_procIONSample;
  Optional<int> apm_sf_delayMode;
  Optional<int> apm_sf_stftType;
  Optional<int> apm_sf_procChainMode;
  Optional<int> apm_sf_nlpEnable;
  Optional<int> apm_sf_nsEnable;
  Optional<int> apm_sf_biquadEnable;
  Optional<int> apm_sf_ainlpToLoadFlag;
  Optional<int> apm_sf_ainlpMonitorLen;
  Optional<int> apm_sf_ainsToLoadFlag;
  Optional<int> apm_sf_ainsMonitorLen;
  Optional<int> apm_sf_ainsLowLatencyFlag;
  Optional<int> apm_sf_nlpAlgRoute;
  Optional<int> apm_sf_nsngAlgRoute;
  Optional<int> apm_sf_nlpFrmRemoveEngRatioThr;
  Optional<int> apm_sf_trdNlpFrmRmvEngRatioThr;
  Optional<int> apm_sf_nlpHbandAgg;
  Optional<int> apm_sf_ainsKillHEBandFlag;
  Optional<int> apm_sf_ainlpLowLatencyFlag;
  Optional<int> apm_sf_fallBackThrRatio;
  Optional<int> apm_sf_fallBackRefMode;
  Optional<int> apm_sf_fallBackPref;
  Optional<int> apm_sf_nlpNoiseAddThr;
  Optional<int> apm_sf_nlpNoiseAddGain;
  Optional<int> apm_sf_nlpAggressiveness;
  Optional<int> apm_sf_nlpHeadsetAgg;
  Optional<int> apm_sf_nlpSpkrAgg;
  Optional<int> apm_sf_nlpDynamicMode;
  Optional<int> apm_sf_ainlpHotResetFrq;
  Optional<int> apm_sf_ainlpHotResetFactor;
  Optional<int> apm_sf_ainlpMonitorQuantile;
  Optional<int> apm_sf_nsngPredefAgg;
  Optional<int> apm_sf_nsngMusicProbThr;
  Optional<int> apm_sf_nsngMusicModeBackoffDB;
  Optional<int> apm_sf_statNsEnhFactor;
  Optional<int> apm_sf_statNsNoiseOverEst;
  Optional<int> apm_sf_statNsOverDrive;
  Optional<int> apm_sf_statNsLowerBound;
  Optional<int> apm_sf_statNsSpchUpdateRadix;
  Optional<int> apm_sf_statNsNoiseUpdateRadix;
  Optional<int> apm_sf_statNsEndStartupShort;
  Optional<int> apm_sf_statNsEndStartupLong;
  Optional<int> apm_sf_statNsNoiseUpdateQuantile;
  Optional<int> apm_sf_nsngMapInMaskMin;
  Optional<int> apm_sf_nsngMapOutMaskMin;
  Optional<int> apm_sf_nsngFinalMaskLowerBound;
  Optional<int> apm_sf_nsngPfMargin;
  Optional<int> apm_sf_ainsHotResetFrq;
  Optional<int> apm_sf_ainsMonitorQuantile;
  Optional<int> apm_sf_nsngAuxToolsMode;
  Optional<int> apm_sf_nlpProcBand;
  Optional<int> apm_sf_nsProcBand;
  Optional<int> apm_sf_ainsModelPref;
  Optional<int> apm_sf_ainlpModelPref;
  Optional<int> apm_vsc_enabled;
  Optional<int> apm_vsc_gender;
  Optional<int> apm_vsc_effect;
  Optional<int> apm_vsc_selfConfig;
  Optional<int> apm_vsc_preset;
  Optional<int> apm_vsc_gain;
  Optional<uint32_t> apm_ns_enable_ns_follow_agc;
  Optional<int32_t>  apm_ns_level;
  Optional<uint32_t> apm_ns_noiseGateThres;
  Optional<int32_t> apm_ns_complexity;
  // AINS
  // che.audio.nsng.anasize , che.audio.nsng.fftsize
  Optional<int32_t> apm_ains_fft_size;
  // che.audio.nsng.maxtime
  Optional<int32_t> apm_ains_maxtolerant_ms;
  // che.audio.nsng.attackfactor
  Optional<int32_t> apm_ains_attack_factor;
  // che.audio.nsng.releasefactor
  Optional<int32_t> apm_ains_release_factor;
  // che.audio.nsng.upperbound
  Optional<int32_t> apm_ains_upper_bound;
  // che.audio.nsng.uppermask
  Optional<int32_t> apm_ains_upper_mask;
  // che.audio.nsng.lowerBound
  Optional<int32_t> apm_ains_lower_bound;
  // che.audio.nsng.lowerMask
  Optional<int32_t> apm_ains_lower_mask;
  //che.audio.ns.end_startup_long
  Optional<int32_t> apm_nsng_end_start_up_long;
  //che.audio.ns.end_startup_short
  Optional<int32_t> apm_nsng_end_start_up_short;
  //che.audio.ns.quntile
  Optional<int32_t> apm_nsng_quantile;
  //che.audio.ns.noise_update_factor
  Optional<int32_t> apm_nsng_noise_update_factor;
  //che.audio.ns.speech_update_factor
  Optional<int32_t> apm_nsng_speech_update_factor;
  //che.audio.ns.overdrive
  Optional<int32_t> apm_nsng_overdrive;
  //che.audio.vad.threshold
  Optional<int32_t> apm_nsng_vad_threshold;
  //che.audio.md.threshold
  Optional<int32_t> apm_nsng_md_threshold;
  //che.audio.nsng.ains_reset_frame
  Optional<int32_t> apm_ains_reset_frame;
  //che.audio.nsng.ains_kill_highband
  Optional<int32_t> apm_ains_kill_highband;
  //che.audio.ns.noise_ref_protect
  Optional<int32_t> apm_nsng_noise_ref_protect;
  // che.audio.nsng.triangle_1
  Optional<int32_t> apm_ains_triangle_1;
  // che.audio.nsng.triangle_2
  Optional<int32_t> apm_ains_triangle_2;
  // che.audio.nsng.triangle_3
  Optional<int32_t> apm_ains_triangle_3;
  // che.audio.nsng.thresholdai
  Optional<int32_t> apm_ains_threshold_ai;
  // che.audio.nsng.thresholdstastical
  Optional<int32_t> apm_ains_threshold_stastical;
  // che.audio.nsng.enhfactorai
  Optional<int32_t> apm_ains_enh_factor_ai;
  // che.audio.nsng.enhfactorstastical
  Optional<int32_t> apm_ains_enh_factor_stastical;
  // che.audio.nsng.noiseoverestimate
  Optional<int32_t> apm_ains_noise_over_estimate;
  // che.audio.nsng.statisticalbound
  Optional<int32_t> apm_ains_statistical_bound;
  // che.audio.nsng.gainboostfreq1
  Optional<int32_t> apm_ains_gain_boost_frq1;
  // che.audio.nsng.gainboostval1
  Optional<int32_t> apm_ains_gain_boost_gain1;
  // che.audio.nsng.gainboostfreq2
  Optional<int32_t> apm_ains_gain_boost_frq2;
  // che.audio.nsng.gainboostval2
  Optional<int32_t> apm_ains_gain_boost_gain2;
  // che.audio.nsng.gainboostfreq3
  Optional<int32_t> apm_ains_gain_boost_frq3;
  // che.audio.nsng.gainboostval3
  Optional<int32_t> apm_ains_gain_boost_gain3;
  // che.audio.nsng.finallowermask
  Optional<int32_t> apm_ains_final_lower_mask;
  // che.audio.nsng.noisepowfloor
  Optional<int32_t> apm_ains_noise_pow_floor;
  // che.audio.nsng.pinkfactor , che.audio.nsng.cngbasemagnitude
  Optional<int32_t> apm_ains_cng_base_magnitude;
  // che.audio.nsng.strategy
  Optional<int32_t> apm_ains_strategy;
  // che.audio.nsng.postfiltermargin
  Optional<int32_t> apm_ains_postfilter_margin;
  // che.audio.nsng.delaymode
  Optional<int32_t> apm_ains_delaymode;
  // che.audio.nsng.aggressive
  Optional<int32_t> apm_ains_aggressive;

  // Double talk detection switcher.
  // Android game streaming scenario should be true, all other cases should be false;
  Optional<bool> apm_enable_record_boost;
  Optional<int32_t> apm_farend_gain_threshold;
  Optional<int32_t> adm_win_recording_device_buffer_ms;
  Optional<bool> adm_windows_layer_with_waveapi;
  Optional<bool> adm_windows_bypass_system_render_apo;
  Optional<bool> adm_windows_enable_microphone_boost;
  Optional<bool> adm_aggregate_playout_device_volume_control;
  Optional<bool> adm_microphone_volume_init_state;
  Optional<bool> adm_mac_use_audio_unit_hal;
  Optional<bool> adm_mac_allow_virtual_recording_device;
  Optional<bool> adm_mac_allow_virtual_playout_device;
  Optional<uint32_t> apm_farend_gain;
  Optional<uint32_t> acm_bitrate;
  Optional<uint32_t> acm_codec;
  Optional<bool> acm_dtx;
  Optional<bool> acm_plc;
  Optional<uint32_t> acm_complex_level;
  Optional<uint32_t> acm_ptime;
  Optional<bool> acm_hw_encode_opus;
  Optional<bool> acm_hw_decode_opus;
  Optional<bool> acm_opus_celt_only;
  Optional<int32_t> acm_opus_max_encoded_bytes;
  Optional<bool> acm_opus_enable_volume_based_bitrate_reduction;
  Optional<int32_t> acm_opus_voice_threshold;
  Optional<int32_t> acm_opus_voice_up_coef;
  Optional<int32_t> acm_opus_voice_down_coef;
  Optional<int32_t> acm_opus_voice_hold_window_ms;
  Optional<int32_t> acm_opus_silence_bitrate;
  Optional<bool> audio_resend;
  Optional<bool> enable_adaptable_fix_rsfec;
  Optional<uint32_t> audio_rsfec_frame_num;
  Optional<uint32_t> audio_rsfec_interleave_num;
  Optional<uint32_t> audio_fec_frame_num;
  Optional<uint32_t> audio_fec_interleave_num;
  Optional<uint32_t> neteq_live_min_delay;
  Optional<uint32_t> neteq_jitter_buffer_max_packets;
  Optional<bool> neteq_jitter_buffer_fast_accelerate;
  Optional<int32_t> neteq_jitter_max_target_delay;
  Optional<int32_t> neteq_filter_target_loss;
  Optional<int32_t> neteq_max_filter_window;
  Optional<int32_t> neteq_acceleration_percent;
  Optional<int32_t> neteq_deceleration_percent;
  Optional<int32_t> neteq_scretch_threshold_percent;
  Optional<int32_t> neteq_unvoice_accelerate_percent;
  Optional<int32_t> neteq_max_wait_ms;
  Optional<int32_t> neteq_max_wait_first_decode_ms;
  Optional<bool> neteq_enable_time_stretching;
  Optional<bool> neteq_enable_expired_peak_detector;
  Optional<bool> neteq_enable_peak_detector;
  Optional<bool> neteq_enable_muted_state;
  Optional<int32_t> neteq_max_exceed_time_ms;
  Optional<uint32_t> neteq_max_filter_dup_num;
  Optional<bool> neteq_enable_voice_volume_level;
  Optional<bool> neteq_enable_individuality_delay;
  Optional<bool> neteq_enable_improve_burst;
  Optional<int32_t> neteq_max_mute_duration_ms;
  Optional<int32_t> neteq_low_latency_burst_control_window_ms;
  Optional<int32_t> neteq_low_latency_burst_control_platform_ms;
  Optional<int32_t> neteq_low_latency_burst_peak_num_threshold;
  Optional<int32_t> neteq_low_latency_burst_trend_threshold;
  Optional<int32_t> neteq_low_latency_burst_peak_trend_increased_threshold;
  Optional<int32_t> neteq_low_latency_burst_overuse_limited_quantile;
  Optional<int32_t> neteq_low_latency_burst_comb_window_second;
  Optional<int32_t> neteq_low_latency_burst_max_jitter_limit_ms;
  Optional<int32_t> neteq_high_latency_burst_control_window_ms;
  Optional<int32_t> neteq_high_latency_burst_control_platform_ms;
  Optional<int32_t> neteq_high_latency_burst_peak_num_threshold;
  Optional<int32_t> neteq_high_latency_burst_trend_threshold;
  Optional<int32_t> neteq_high_latency_burst_peak_trend_increased_threshold;
  Optional<int32_t> neteq_high_latency_burst_overuse_limited_quantile;
  Optional<int32_t> neteq_high_latency_burst_comb_window_second;
  Optional<int32_t> neteq_high_latency_burst_max_jitter_limit_ms;
  Optional<int32_t> neteq_freeze_m;
  Optional<int32_t> neteq_freeze_n;
  Optional<int32_t> neteq_targetlevel_offset;
  Optional<bool> neteq_enable_stable_playout;
  Optional<int32_t> neteq_drop_window_threshold_ms;
  Optional<int32_t> neteq_drop_distance_threshold_ms;
  Optional<int32_t> neteq_prebuffer_window_threshold_ms;
  Optional<int32_t> neteq_prebuffer_distance_threshold_ms;
  Optional<int32_t> neteq_max_packets_stable_playout;
  Optional<int32_t> neteq_normal_recv_rate_ratio_threshold;

  Optional<bool> neteq_target_level_optimization;
  Optional<uint32_t> neteq_aqm_voice_threshold;
  Optional<uint32_t> neteq_dump_level;
  Optional<std::string> neteq_dump_path;
  Optional<int> neteq_limit_prob;
  Optional<int> neteq_pre_dump;
  Optional<int> neteq_lower_limit_probability;
  Optional<int> neteq_plc_mode;
  Optional<int> neteq_outlier_detector;
  Optional<uint32_t> dwlink_gain;
  Optional<uint32_t> uplink_gain;
  Optional<bool> adm_separate_audio_unit;

  // derived options
  Optional<bool> derived_headset_black_list_device;
  Optional<int> use_media_volume_in_headset;
  Optional<int> use_media_volume_in_audience;
  Optional<int> use_media_volume_in_solo;
  Optional<int> use_media_volume_in_bluetooth;
  Optional<bool> enable_audio_label;

 private:
  template <typename T>
  static void SetFrom(Optional<T>* s, const Optional<T>& o) {
    if (o) {
      *s = o;
    }
  }
};

}  // namespace rtc
}  // namespace agora
