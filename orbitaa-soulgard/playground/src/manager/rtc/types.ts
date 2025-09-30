import {
  UID,
  IAgoraRTCRemoteUser,
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  NetworkQuality,
} from "agora-rtc-sdk-ng"
import { IChatItem, ITextItem } from "@/types"

export interface IRtcUser extends IUserTracks {
  userId: UID
}

export interface ITranscriptData {
  text: string;
  isFinal: boolean;
}

export interface RtcEvents {
  remoteUserChanged: (user: IRtcUser) => void
  localTracksChanged: (tracks: IUserTracks) => void
  networkQuality: (quality: NetworkQuality) => void
  textChanged: (text: IChatItem) => void
  userTranscript: (data: ITranscriptData) => void
  bitaaTranscript: (data: ITranscriptData) => void
}

export interface IUserTracks {
  audioTrack?: IMicrophoneAudioTrack
}
