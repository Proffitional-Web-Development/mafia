"use client";

import { Icon } from "@/components/ui/icon";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

interface AvatarCircleProps {
  username?: string;
  avatarUrl?: string;
  size?: number;
  showOnline?: boolean;
  glow?: boolean;
  selected?: boolean;
  dead?: boolean;
  editable?: boolean;
  glowWrapper?: boolean;
  className?: string;
}

export function AvatarCircle({
  username,
  avatarUrl,
  size = 48,
  showOnline = false,
  glow = false,
  selected = false,
  dead = false,
  editable = false,
  glowWrapper = false,
  className,
}: AvatarCircleProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      {glowWrapper ? (
        <span className="pointer-events-none absolute -inset-1 rounded-full bg-primary/40 blur-md" />
      ) : null}

      <div
        className={cn(
          "relative rounded-full",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          glow && "glow-primary rounded-full",
          dead && "grayscale opacity-60",
        )}
      >
        <UserAvatar username={username} avatarUrl={avatarUrl} size={size} />

        {showOnline ? (
          <span className="absolute bottom-0 end-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-success" />
        ) : null}

        {editable ? (
          <span className="absolute -bottom-1 -end-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-surface text-text-secondary">
            <Icon name="edit" size="sm" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
