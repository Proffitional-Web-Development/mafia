"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";

export function BackgroundMusicProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useQuery(api.users.getCurrentUser);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Default to true if user is not loaded yet or if preference is missing (though schema default is handled)
  // Logic: if user is undefined (loading), don't play yet? Or play if default is yes?
  // Let's wait for user to be loaded to respect preference.
  // Actually, if we wait, it might be jarring. But better than playing when disabled.
  const isMusicEnabled = user?.musicEnabled ?? false;

  useEffect(() => {
    const handleInteraction = () => {
      // Try resolving autoplay restriction if pending
      if (audioRef.current && isMusicEnabled && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [isMusicEnabled]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isMusicEnabled) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented
          console.log("Autoplay prevented:", error);
          // We wait for interaction (handled by the other effect)
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isMusicEnabled]); // Re-run when preference changes

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }
  }, []);

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/game-ambient.mp3"
        loop
        preload="auto"
        className="hidden"
      >
        <track
          kind="captions"
          src="/audio/game-ambient.vtt"
          srcLang="en"
          label="Ambient audio"
          default
        />
      </audio>
      {children}
    </>
  );
}
