import type { Doc } from "@/convex/_generated/dataModel";

type GamePhase = Doc<"games">["phase"];

export const PHASE_AUDIO: Partial<Record<GamePhase, string>> = {
  discussion: "/audio/phases/discussion.mp3",
  publicVoting: "/audio/phases/publicVoting.mp3",
  abilityPhase: "/audio/phases/abilityPhase.mp3",
  mafiaVoting: "/audio/phases/mafiaVoting.mp3",
  resolution: "/audio/phases/resolution.mp3",
};

const BACKGROUND_DEFAULT_VOLUME = 0.3;
const BACKGROUND_DUCKED_VOLUME = 0.1;
const CUE_FADE_OUT_MS = 500;

let activeCue: HTMLAudioElement | null = null;
let activeFadeTimer: number | null = null;
let pendingCue: { src: string; volume: number } | null = null;
let pendingListenersAttached = false;

function getBackgroundMusic() {
  return document.querySelector<HTMLAudioElement>("audio[loop]");
}

function setBackgroundVolume(volume: number) {
  const bgMusic = getBackgroundMusic();
  if (!bgMusic || bgMusic.paused) return;
  bgMusic.volume = volume;
}

function clearActiveFadeTimer() {
  if (activeFadeTimer !== null) {
    window.clearInterval(activeFadeTimer);
    activeFadeTimer = null;
  }
}

function fadeOutAndStop(audio: HTMLAudioElement, durationMs: number) {
  clearActiveFadeTimer();

  const startVolume = audio.volume;
  const startedAt = Date.now();

  activeFadeTimer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const ratio = Math.min(1, elapsed / durationMs);
    audio.volume = Math.max(0, startVolume * (1 - ratio));

    if (ratio >= 1) {
      clearActiveFadeTimer();
      audio.pause();
      audio.currentTime = 0;
    }
  }, 50);
}

function detachPendingListeners() {
  if (!pendingListenersAttached) return;

  window.removeEventListener("click", playPendingCueOnInteraction);
  window.removeEventListener("keydown", playPendingCueOnInteraction);
  window.removeEventListener("touchstart", playPendingCueOnInteraction);
  pendingListenersAttached = false;
}

function attachPendingListeners() {
  if (pendingListenersAttached) return;

  window.addEventListener("click", playPendingCueOnInteraction);
  window.addEventListener("keydown", playPendingCueOnInteraction);
  window.addEventListener("touchstart", playPendingCueOnInteraction);
  pendingListenersAttached = true;
}

function playPendingCueOnInteraction() {
  if (!pendingCue) {
    detachPendingListeners();
    return;
  }

  const cue = pendingCue;
  pendingCue = null;
  void playCueInternal(cue.src, cue.volume, false);
}

async function playCueInternal(
  src: string,
  volume: number,
  queueOnAutoplayBlock: boolean,
) {
  if (activeCue) {
    fadeOutAndStop(activeCue, CUE_FADE_OUT_MS);
  }

  const cue = new Audio(src);
  cue.preload = "auto";
  cue.volume = volume;
  activeCue = cue;

  setBackgroundVolume(BACKGROUND_DUCKED_VOLUME);

  const restoreBackground = () => {
    if (activeCue === cue) {
      activeCue = null;
    }
    setBackgroundVolume(BACKGROUND_DEFAULT_VOLUME);
  };

  cue.onended = restoreBackground;
  cue.onerror = restoreBackground;

  try {
    await cue.play();
    if (!pendingCue) {
      detachPendingListeners();
    }
  } catch {
    restoreBackground();
    if (queueOnAutoplayBlock) {
      pendingCue = { src, volume };
      attachPendingListeners();
    }
  }
}

export function playPhaseCue(phase: GamePhase, enabled: boolean) {
  if (!enabled) return;
  const src = PHASE_AUDIO[phase];
  if (!src) return;
  void playCueInternal(src, 0.7, true);
}

export function playRoundEndCue(enabled: boolean) {
  if (!enabled) return;
  void playCueInternal("/audio/phases/roundEnd.mp3", 0.6, true);
}
