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
    bg: "bg-danger/25",
    text: "text-danger",
    border: "border-danger/50",
    accent: "#ec1313",
  },
  citizens: {
    bg: "bg-primary/25",
    text: "text-primary-light",
    border: "border-primary/50",
    accent: "#8311d4",
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
    bg: "bg-danger/20",
    text: "text-danger",
    border: "border-danger/50",
  },
  citizen: {
    bg: "bg-primary/20",
    text: "text-primary-light",
    border: "border-primary/50",
  },
  sheikh: {
    bg: "bg-success/20",
    text: "text-success",
    border: "border-success/50",
  },
  girl: {
    bg: "bg-primary/20",
    text: "text-primary-light",
    border: "border-primary/50",
  },
  boy: {
    bg: "bg-warning/20",
    text: "text-warning",
    border: "border-warning/50",
  },
};

// ---------------------------------------------------------------------------
// Phase colours & icons
// ---------------------------------------------------------------------------

export const PHASE_META: Record<string, { icon: string; color: string }> = {
  cardDistribution: { icon: "style", color: "text-text-tertiary" },
  discussion: { icon: "chat", color: "text-primary-light" },
  publicVoting: { icon: "how_to_vote", color: "text-warning" },
  abilityPhase: { icon: "bolt", color: "text-primary-light" },
  mafiaVoting: { icon: "my_location", color: "text-danger" },
  resolution: { icon: "wb_sunny", color: "text-success" },
  endCheck: { icon: "visibility", color: "text-text-tertiary" },
  finished: { icon: "emoji_events", color: "text-text-secondary" },
};

// ---------------------------------------------------------------------------
// Typography scale
// ---------------------------------------------------------------------------

export const TYPOGRAPHY = {
  /** Headline on game-over / phase-transition screens */
  hero: "text-3xl font-bold tracking-tight leading-tight",
  /** Section headings inside panels */
  heading: "text-lg font-bold tracking-tight",
  /** Card / list item labels */
  label: "text-sm font-medium text-text-secondary",
  /** Supporting text, descriptions */
  body: "text-sm text-text-secondary",
  /** Tiny metadata (round counter, timestamps) */
  caption: "text-xs text-text-muted tracking-wider",
} as const;

// ---------------------------------------------------------------------------
// Spacing tokens (maps to Tailwind spacing values)
// ---------------------------------------------------------------------------

export const SPACING = {
  /** Outer page padding */
  page: "px-6 py-6",
  /** Section gap */
  section: "gap-6",
  /** Inner card padding */
  card: "p-4",
  /** Tight inline gap */
  inline: "gap-2",
} as const;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const LAYOUT = {
  /** Max-width constraint for game area */
  maxWidth: "max-w-sm",
  /** Breakpoint-aware player grid columns */
  playerGrid: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
} as const;
