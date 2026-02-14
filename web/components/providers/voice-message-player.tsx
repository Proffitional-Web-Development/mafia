"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { VOICE_CLIPS, VoiceClipKey } from "@/lib/voice-clips";
import { Id } from "@/convex/_generated/dataModel";

interface VoiceMessagePlayerProps {
  gameId: Id<"games">;
}

export function VoiceMessagePlayer({ gameId }: VoiceMessagePlayerProps) {
  const user = useQuery(api.users.getCurrentUser);
  // We need to subscribe to both public and mafia channels to hear voice messages
  // Wait, mafia channel messages are only for mafia. Public messages for everyone.
  // Actually, typically voice messages are sent in public chat in this game design?
  // T30 says "broadcast to all players in the room". So even if sent in mafia chat?
  // T30 issue 5 says "If a mafia player sends a voice message in anonymous mode, render ... as MAFIA".
  // This implies they are sent in public channel, just anonymously. 
  // Let's listen to public channel. 
  
  // NOTE: getChatMessages is a query. To detect NEW messages, we can:
  // 1. Maintain a "last seen timestamp" ref.
  // 2. Filter messages.
  
  const messages = useQuery(api.chat.getChatMessages, { gameId, channel: "public" });

  const [queue, setQueue] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const lastProcessedTimeRef = useRef<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // We reuse musicEnabled preference
  const soundEnabled = user?.musicEnabled ?? true; 

  // Detect new voice messages
  useEffect(() => {
    if (!messages || !soundEnabled) return;

    const newVoiceMessages = messages.filter(msg => 
      msg.isVoice && 
      msg.voiceClipKey && 
      msg.timestamp > lastProcessedTimeRef.current
    );

    if (newVoiceMessages.length > 0) {
      // Find valid clips
      const clipsToAdd: string[] = [];
      
      // Sort by timestamp to play in order
      newVoiceMessages.sort((a, b) => a.timestamp - b.timestamp);

      for (const msg of newVoiceMessages) {
        if (!msg.voiceClipKey) continue;
        const clipInfo = VOICE_CLIPS.find(c => c.key === msg.voiceClipKey);
        if (clipInfo) {
          clipsToAdd.push(clipInfo.file);
        }
      }

      if (clipsToAdd.length > 0) {
        setQueue(prev => [...prev, ...clipsToAdd]);
      }

      // Update timestamp to the latest message
      const latest = newVoiceMessages[newVoiceMessages.length - 1];
      lastProcessedTimeRef.current = latest.timestamp;
    }
  }, [messages, soundEnabled]);

  // Effect to process queue
  useEffect(() => {
    if (!isPlaying && queue.length > 0) {
      const nextFile = queue[0];
      // remove from queue immediately to prevent loop? 
      // No, playClip removes it on end or error.
      // But we need to ensure playClip doesn't get called repeatedly for same item if isPlaying isn't set fast enough?
      // isPlaying is state, so it updates asynchronously? No, inside playClip we set it.
      // But let's be safe: pass handle to playClip
      playClip(nextFile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, isPlaying]);

  const playClip = (file: string) => {
    setIsPlaying(true);
    
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
       setQueue(prev => prev.slice(1));
       if (bgMusic) {
         bgMusic.volume = 0.3; 
       }
    };

    audio.onended = cleanup;
    
    audio.onerror = (e) => {
      console.error("Failed to play voice clip:", file, e);
      cleanup();
    };
    
    audio.play().catch(err => {
        // Autoplay blocked
        // We just drop it from auto-queue
        cleanup();
    });
  };

  return null; // Headless component
}
