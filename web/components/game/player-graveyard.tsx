"use client";

import { useTranslations } from "next-intl";
import { GraveyardSheet } from "@/components/game/graveyard-sheet";

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

  return <GraveyardSheet players={players} title={t("title")} />;
}
