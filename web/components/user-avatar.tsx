"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

type UserAvatarProps = {
  username?: string;
  avatarUrl?: string;
  size?: number;
};

function getInitial(username?: string) {
  if (!username || username.length === 0) {
    return "?";
  }
  return username.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  username,
  avatarUrl,
  size = 40,
}: UserAvatarProps) {
  const t = useTranslations("common");
  const avatarLabel = username
    ? t("userAvatarFor", { username })
    : t("userAvatar");

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-semibold text-zinc-700"
      style={{ width: size, height: size }}
      role="img"
      aria-label={avatarLabel}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={avatarLabel}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span>{getInitial(username)}</span>
      )}
    </div>
  );
}
