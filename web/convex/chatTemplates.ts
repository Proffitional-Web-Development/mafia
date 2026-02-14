// ---------------------------------------------------------------------------
// Chat Template Registry — predefined i18n-ready chat messages
// ---------------------------------------------------------------------------

export type ChatChannel = "public" | "mafia";

export interface ChatTemplate {
  /** i18n message key */
  key: string;
  /** Placeholder names expected in templateParams */
  placeholders: string[];
  /** Channels where this template is available */
  channels: ChatChannel[];
  /** English fallback for content field */
  fallbackEn: string;
}

export const CHAT_TEMPLATES: ChatTemplate[] = [
  // ── Public channel templates ──────────────────────────────────────────
  {
    key: "chat.template.suspect",
    placeholders: ["player"],
    channels: ["public"],
    fallbackEn: "I suspect {player}",
  },
  {
    key: "chat.template.voteFor",
    placeholders: ["player"],
    channels: ["public"],
    fallbackEn: "Vote for {player}",
  },
  {
    key: "chat.template.trustMe",
    placeholders: [],
    channels: ["public"],
    fallbackEn: "Trust me, I'm innocent",
  },
  {
    key: "chat.template.waitNextRound",
    placeholders: [],
    channels: ["public"],
    fallbackEn: "Let's wait for the next round",
  },
  {
    key: "chat.template.followMyLead",
    placeholders: [],
    channels: ["public"],
    fallbackEn: "Follow my lead",
  },
  {
    key: "chat.template.sayNothing",
    placeholders: [],
    channels: ["public"],
    fallbackEn: "Stay quiet, don't reveal anything",
  },

  // ── Mafia channel templates ───────────────────────────────────────────
  {
    key: "chat.template.mafiaTarget",
    placeholders: ["player"],
    channels: ["mafia"],
    fallbackEn: "Target {player} tonight",
  },
  {
    key: "chat.template.mafiaAvoid",
    placeholders: ["player"],
    channels: ["mafia"],
    fallbackEn: "Don't target {player}",
  },
  {
    key: "chat.template.mafiaBlend",
    placeholders: [],
    channels: ["mafia"],
    fallbackEn: "Act normal, blend in",
  },
  {
    key: "chat.template.mafiaAgree",
    placeholders: [],
    channels: ["mafia"],
    fallbackEn: "Agreed",
  },
];

/** Quick lookup set of valid template keys */
export const TEMPLATE_KEY_SET = new Set(CHAT_TEMPLATES.map((t) => t.key));

/** Get templates available for a given channel */
export function getTemplatesForChannel(channel: ChatChannel): ChatTemplate[] {
  return CHAT_TEMPLATES.filter((t) => t.channels.includes(channel));
}

/** Resolve English fallback text by replacing placeholders */
export function resolveTemplateFallback(
  template: ChatTemplate,
  params: Record<string, string>
): string {
  let text = template.fallbackEn;
  for (const placeholder of template.placeholders) {
    text = text.replace(
      `{${placeholder}}`,
      params[placeholder] ?? `{${placeholder}}`
    );
  }
  return text;
}
