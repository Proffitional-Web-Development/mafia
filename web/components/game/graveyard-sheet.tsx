import { AvatarCircle } from "@/components/ui/avatar-circle";
import { cn } from "@/lib/utils";

interface GraveyardPlayer {
  playerId: string;
  username: string;
  avatarUrl?: string;
}

interface GraveyardSheetProps {
  players: GraveyardPlayer[];
  title?: string;
  className?: string;
}

export function GraveyardSheet({
  players,
  title = "Graveyard",
  className,
}: GraveyardSheetProps) {
  if (players.length === 0) return null;

  return (
    <section
      className={cn(
        "rounded-t-2xl border border-white/10 bg-surface/80 p-4",
        className
      )}
    >
      <div className="mb-3 flex justify-center">
        <span className="h-1.5 w-12 rounded-full bg-white/20" aria-hidden />
      </div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {players.map((player) => (
          <div
            key={player.playerId}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5"
          >
            <AvatarCircle
              username={player.username}
              avatarUrl={player.avatarUrl}
              size={28}
              dead
            />
            <span className="truncate text-xs text-text-secondary">
              {player.username}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
