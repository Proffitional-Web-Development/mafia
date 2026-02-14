import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InvestigationItem {
  round: number;
  targetUsername: string;
  faction: "mafia" | "citizens";
}

interface InvestigationLogProps {
  items: InvestigationItem[];
  title?: string;
  emptyLabel?: string;
  className?: string;
}

export function InvestigationLog({
  items,
  title = "Investigation Log",
  emptyLabel = "No investigations yet",
  className,
}: InvestigationLogProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md",
        className,
      )}
    >
      <h3 className="mb-2 text-sm font-semibold text-white">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-text-muted">{emptyLabel}</p>
      ) : (
        <ul className="max-h-28 space-y-2 overflow-y-auto no-scrollbar">
          {items.map((item) => (
            <li
              key={`${item.round}-${item.targetUsername}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5"
            >
              <span className="text-xs text-text-secondary">
                Round {item.round} · {item.targetUsername}
              </span>
              <Badge
                variant="investigation-result"
                resultTone={item.faction === "mafia" ? "mafia" : "innocent"}
              >
                {item.faction === "mafia" ? "Mafia" : "Citizen"}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
