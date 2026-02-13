import { cn } from "@/lib/utils";

interface SuggestedChipsProps {
  suggestions: string[];
  onSelect: (value: string) => void;
  className?: string;
}

export function SuggestedChips({
  suggestions,
  onSelect,
  className,
}: SuggestedChipsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-white"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
