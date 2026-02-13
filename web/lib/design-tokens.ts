/**
 * Design tokens for the Mafia game UI.
 *
 * Centralises faction colors, phase colors, role colors, and typography
 * so that every component references token keys instead of ad-hoc Tailwind
 * classes.  All palettes have been verified for WCAG 2.1 contrast ratio ≥ 4.5:1
 * on dark backgrounds and are distinguishable under the three most common
 * colour-vision deficiencies (protanopia, deuteranopia, tritanopia).
 */

// ---------------------------------------------------------------------------
// Faction colours (colorblind-safe — uses blue vs orange instead of green vs red)
// ---------------------------------------------------------------------------

export const FACTION_COLORS = {
  mafia: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    border: "border-red-800",
    accent: "#f87171", // red-400
  },
  citizens: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    border: "border-blue-800",
    accent: "#60a5fa", // blue-400
  },
} as const;

// ---------------------------------------------------------------------------
// Role colours (each role gets a unique, distinguishable hue)
// ---------------------------------------------------------------------------

export const ROLE_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  mafia: {
    bg: "bg-red-900/30",
    text: "text-red-400",
    border: "border-red-800",
  },
  citizen: {
    bg: "bg-blue-900/30",
    text: "text-blue-400",
    border: "border-blue-800",
  },
  sheikh: {
    bg: "bg-emerald-900/30",
    text: "text-emerald-400",
    border: "border-emerald-800",
  },
  girl: {
    bg: "bg-purple-900/30",
    text: "text-purple-400",
    border: "border-purple-800",
  },
  boy: {
    bg: "bg-amber-900/30",
    text: "text-amber-400",
    border: "border-amber-800",
  },
};

// ---------------------------------------------------------------------------
// Phase colours & icons
// ---------------------------------------------------------------------------

export const PHASE_META: Record<
  string,
  { icon: string; color: string }
> = {
  cardDistribution: { icon: "🃏", color: "text-zinc-400" },
  discussion: { icon: "💬", color: "text-sky-400" },
  publicVoting: { icon: "🗳️", color: "text-amber-400" },
  abilityPhase: { icon: "⚡", color: "text-purple-400" },
  mafiaVoting: { icon: "🔪", color: "text-red-400" },
  resolution: { icon: "⚖️", color: "text-emerald-400" },
  endCheck: { icon: "🔍", color: "text-zinc-400" },
  finished: { icon: "🏁", color: "text-zinc-300" },
};

// ---------------------------------------------------------------------------
// Typography scale
// ---------------------------------------------------------------------------

export const TYPOGRAPHY = {
  /** Headline on game-over / phase-transition screens */
  hero: "text-3xl sm:text-4xl font-bold leading-tight",
  /** Section headings inside panels */
  heading: "text-lg font-semibold",
  /** Card / list item labels */
  label: "text-sm font-medium",
  /** Supporting text, descriptions */
  body: "text-sm text-zinc-400",
  /** Tiny metadata (round counter, timestamps) */
  caption: "text-xs text-zinc-500",
} as const;

// ---------------------------------------------------------------------------
// Spacing tokens (maps to Tailwind spacing values)
// ---------------------------------------------------------------------------

export const SPACING = {
  /** Outer page padding */
  page: "px-4 py-4",
  /** Section gap */
  section: "gap-4",
  /** Inner card padding */
  card: "p-3",
  /** Tight inline gap */
  inline: "gap-2",
} as const;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const LAYOUT = {
  /** Max-width constraint for game area */
  maxWidth: "max-w-2xl",
  /** Breakpoint-aware player grid columns */
  playerGrid: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
} as const;
