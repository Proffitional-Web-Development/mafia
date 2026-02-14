export const VOICE_CLIPS = [
  {
    key: "ya_patl",
    file: "/audio/chat-voices/ya_patl.mp3",
    labelKey: "chat.voice.ya_patl",
  },
  {
    key: "7hl_3ne",
    file: "/audio/chat-voices/7hl_3ne.mp3",
    labelKey: "chat.voice.7hl_3ne",
  },
  {
    key: "lh_lh_lh",
    file: "/audio/chat-voices/lh_lh_lh.mp3",
    labelKey: "chat.voice.lh_lh_lh",
  },
  {
    key: "lk_mbsoot",
    file: "/audio/chat-voices/lk_mbsoot.mp3",
    labelKey: "chat.voice.lk_mbsoot",
  },
  {
    key: "lk_3la_meen",
    file: "/audio/chat-voices/lk_3la_meen.mp3",
    labelKey: "chat.voice.lk_3la_meen",
  },
  {
    key: "laaa",
    file: "/audio/chat-voices/laaa.mp3",
    labelKey: "chat.voice.laaa",
  },
] as const;

export type VoiceClipKey = (typeof VOICE_CLIPS)[number]["key"];
