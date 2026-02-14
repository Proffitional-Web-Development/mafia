import { AvatarCircle } from "@/components/ui/avatar-circle";
import { cn } from "@/lib/utils";

interface UserStatusCardProps {
  username?: string;
  avatarUrl?: string;
  subtitle?: string;
  online?: boolean;
  className?: string;
}

export function UserStatusCard({
  username,
  avatarUrl,
  subtitle,
  online = true,
  className,
}: UserStatusCardProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-xl border border-white/10 bg-surface/80 px-3 py-2 backdrop-blur-md",
        className
      )}
    >
      <AvatarCircle
        username={username}
        avatarUrl={avatarUrl}
        size={36}
        showOnline={online}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {username ?? "Player"}
        </p>
        {subtitle ? (
          <p className="truncate text-xs text-text-tertiary">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
