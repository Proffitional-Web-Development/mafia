export type Hsl = { h: number; s: number; l: number };

/**
 * Converts a hex color string to HSL object.
 * No external dependencies.
 */
export function hexToHsl(hex: string): Hsl {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = Number.parseInt(`${hex[1]}${hex[1]}`, 16);
    g = Number.parseInt(`${hex[2]}${hex[2]}`, 16);
    b = Number.parseInt(`${hex[3]}${hex[3]}`, 16);
  } else if (hex.length === 7) {
    r = Number.parseInt(`${hex[1]}${hex[2]}`, 16);
    g = Number.parseInt(`${hex[3]}${hex[4]}`, 16);
    b = Number.parseInt(`${hex[5]}${hex[6]}`, 16);
  }
  r /= 255;
  g /= 255;
  b /= 255;
  const cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin;
  let h = 0,
    s = 0,
    l = 0;

  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}

/**
 * Converts HSL values to a hex color string.
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export type ThemePalette = {
  "--app-primary": string;
  "--app-primary-dark": string;
  "--app-primary-light": string;
  "--app-bg": string;
  "--app-surface": string;
  "--app-surface-darker": string;
  "--app-neutral-dark": string;
  "--app-text-accent": string;
};

/**
 * Generates a complete theme palette from a single accent color.
 * Ensures dark mode compatibility and contrast.
 */
export function generateThemePalette(accentHex: string): ThemePalette {
  const { h, s, l } = hexToHsl(accentHex);

  // Clamp lightness for primary color to ensure visibility on dark bg
  // aiming for ~40-70% lightness for the primary action color
  const primaryL = Math.max(40, Math.min(70, l));
  const primaryHex = hslToHex(h, s, primaryL);

  return {
    "--app-primary": primaryHex,
    "--app-primary-dark": hslToHex(h, s, Math.max(10, primaryL - 15)),
    "--app-primary-light": hslToHex(h, s, Math.min(95, primaryL + 15)),

    // Very dark tinted background
    "--app-bg": hslToHex(h, 20, 8),

    // Surface colors (cards, panels)
    "--app-surface": hslToHex(h, 25, 14),
    "--app-surface-darker": hslToHex(h, 22, 10),
    "--app-neutral-dark": hslToHex(h, 15, 16),

    "--app-text-accent": primaryHex,
  };
}

export const THEME_PRESETS = [
  { key: "purple", label: "Royal Purple", hex: "#8311d4" }, // Default
  { key: "red", label: "Crimson", hex: "#ec1313" },
  { key: "blue", label: "Ocean Blue", hex: "#2563eb" },
  { key: "green", label: "Emerald", hex: "#059669" },
  { key: "orange", label: "Sunset", hex: "#ea580c" },
  { key: "pink", label: "Rose", hex: "#e91e63" },
  { key: "cyan", label: "Teal", hex: "#0891b2" },
  { key: "gold", label: "Gold", hex: "#ca8a04" },
] as const;

export type ThemePresetKey = (typeof THEME_PRESETS)[number]["key"];
