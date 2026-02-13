"use client";

import { useTranslations } from "next-intl";
import { UserAvatar } from "@/components/user-avatar";

interface GraveyardPlayer {
  playerId: string;
  username: string;
  avatarUrl?: string;
}

interface PlayerGraveyardProps {
  players: GraveyardPlayer[];
}

export function PlayerGraveyard({ players }: PlayerGraveyardProps) {
  const t = useTranslations("graveyard");

  if (players.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border p-3 space-y-2">
      <h3 className="text-xs font-semibold uppercase text-zinc-500">
        {t("title")}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {players.map((player) => (
          <div
            key={player.playerId}
            className="flex items-center gap-2 rounded-lg border p-2 opacity-80"
          >
            <UserAvatar
              username={player.username}
              avatarUrl={player.avatarUrl}
              size={28}
            />
            <span className="text-xs truncate">💀 {player.username}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
