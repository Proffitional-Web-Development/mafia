import { AvatarCircle } from "@/components/ui/avatar-circle";
import { cn } from "@/lib/utils";

interface EliminationCardProps {
  name: string;
  avatarUrl?: string;
  cause?: string;
  className?: string;
}

export function EliminationCard({
  name,
  avatarUrl,
  cause,
  className,
}: EliminationCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-danger/40 bg-danger/10 p-4 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-3 inline-flex">
        <AvatarCircle
          username={name}
          avatarUrl={avatarUrl}
          size={88}
          dead
          glowWrapper
        />
      </div>
      <h3 className="text-lg font-bold text-danger">{name}</h3>
      {cause ? (
        <p className="mt-1 text-sm text-text-secondary">{cause}</p>
      ) : null}
    </article>
  );
}
