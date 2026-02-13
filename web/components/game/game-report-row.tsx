import { AvatarCircle } from "@/components/ui/avatar-circle";
import { cn } from "@/lib/utils";

interface GameReportRowProps {
  username: string;
  avatarUrl?: string;
  role: string;
  alive: boolean;
  isYou?: boolean;
  isMafia?: boolean;
  className?: string;
}

export function GameReportRow({
  username,
  avatarUrl,
  role,
  alive,
  isYou = false,
  isMafia = false,
  className,
}: GameReportRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-xl border px-3 py-2",
        isYou && "border-warning/60 bg-warning/10",
        !isYou && isMafia && "border-danger/40 bg-danger/10",
        !isYou && !isMafia && "border-white/10 bg-white/5",
        !alive && "opacity-70 grayscale",
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <AvatarCircle username={username} avatarUrl={avatarUrl} size={30} dead={!alive} />
        <span className="truncate text-sm text-text-secondary">{username}</span>
      </div>
      <span className="text-xs font-medium text-text-tertiary">{role}</span>
      <span className={cn("text-xs font-semibold", alive ? "text-success" : "text-danger")}>
        {alive ? "Alive" : "Dead"}
      </span>
    </div>
  );
}
