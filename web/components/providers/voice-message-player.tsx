"use client";

import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { VOICE_CLIPS } from "@/lib/voice-clips";

interface VoiceMessagePlayerProps {
  gameId: Id<"games">;
}

export function VoiceMessagePlayer({ gameId }: VoiceMessagePlayerProps) {
  const user = useQuery(api.users.getCurrentUser);
  const messages = useQuery(api.chat.getChatMessages, {
    gameId,
    channel: "public",
  });

  const [queue, setQueue] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingFile, setPlayingFile] = useState<string | null>(null);
  const [initialTime] = useState(() => Date.now());
  const lastProcessedTimeRef = useRef<number>(initialTime);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // We reuse musicEnabled preference
  const soundEnabled = user?.musicEnabled ?? true;

  // Detect new voice messages
  useEffect(() => {
    if (!messages || !soundEnabled) return;

    const newVoiceMessages = messages.filter(
      (msg) =>
        msg.isVoice &&
        msg.voiceClipKey &&
        msg.timestamp > lastProcessedTimeRef.current,
    );

    if (newVoiceMessages.length > 0) {
      // Find valid clips
      const clipsToAdd: string[] = [];

      // Sort by timestamp to play in order
      newVoiceMessages.sort((a, b) => a.timestamp - b.timestamp);

      for (const msg of newVoiceMessages) {
        if (!msg.voiceClipKey) continue;
        const clipInfo = VOICE_CLIPS.find((c) => c.key === msg.voiceClipKey);
        if (clipInfo) {
          clipsToAdd.push(clipInfo.file);
        }
      }

      if (clipsToAdd.length > 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQueue((prev) => [...prev, ...clipsToAdd]);
      }

      // Update timestamp to the latest message
      const latest = newVoiceMessages[newVoiceMessages.length - 1];
      lastProcessedTimeRef.current = latest.timestamp;
    }
  }, [messages, soundEnabled]);

  const playClip = useCallback((file: string) => {
    setIsPlaying(true);
    setPlayingFile(file);

    // Duck background music - simpler to just set volume directly on global audio helper if available
    // OR query selector as done before
    const bgMusic = document.querySelector<HTMLAudioElement>("audio[loop]");
    if (bgMusic) {
      // Check if playing?
      if (!bgMusic.paused) {
        bgMusic.volume = 0.1;
      }
    }

    const audio = new Audio(file);
    audioRef.current = audio;
    audio.volume = 0.8;

    const cleanup = () => {
      setIsPlaying(false);
      setPlayingFile(null);
      setQueue((prev) => prev.slice(1));
      if (bgMusic) {
        bgMusic.volume = 0.3;
      }
    };

    audio.onended = cleanup;

    audio.onerror = (e) => {
      console.error("Failed to play voice clip:", file, e);
      cleanup();
    };

    // Keep strict mode happy
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked
        // We just drop it from auto-queue
        cleanup();
      });
    }
  }, []);

  // Effect to process queue
  useEffect(() => {
    if (!isPlaying && queue.length > 0) {
      const nextFile = queue[0];
      // prevent re-triggering if already trying to play this file
      if (nextFile === playingFile) return;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      playClip(nextFile);
    }
  }, [queue, isPlaying, playClip, playingFile]);

  return null; // Headless component
}
