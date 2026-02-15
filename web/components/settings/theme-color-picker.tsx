"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { THEME_PRESETS, generateThemePalette } from "@/lib/theme-palette";
import { useTheme } from "@/components/theme-provider";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";

export function ThemeColorPicker() {
  const t = useTranslations("settings.preferences");
  const { accentColor, setAccentColor } = useTheme();
  const setThemeColor = useMutation(api.users.setThemeColor);

  const [customColor, setCustomColor] = useState(accentColor || "#8311d4");
  const [debouncedCustomColor, setDebouncedCustomColor] = useState(customColor);

  // Determine active preset (if matches exactly)
  const activePreset = THEME_PRESETS.find((p) => p.hex === accentColor);
  const isCustom = !!accentColor && !activePreset;

  // Handle preset selection
  const handlePresetSelect = (hex: string) => {
    setAccentColor(hex);
    setThemeColor({ themeColor: hex });
    setCustomColor(hex); // Sync custom picker to selected preset
    setDebouncedCustomColor(hex); // Avoid triggering debounce save
  };

  // Handle custom color input
  const handleCustomColorChange = (hex: string) => {
    setCustomColor(hex);
    setAccentColor(hex); // Live preview
  };

  // Debounce save for custom color
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCustomColor(customColor);
    }, 500);

    return () => clearTimeout(handler);
  }, [customColor]);

  // Save when debounced value settles, only if it's currently marked as custom/active
  // and differs from what was last saved (implied by accentColor logic, but we want 
  // to avoid re-saving presets if user just clicked them).
  useEffect(() => {
    // If accentColor matches debouncedCustomColor, and it is NOT a preset (or is custom override), save it.
    // Actually, simply: if debouncedCustomColor changed, and it matches current accentColor, save it.
    // But we need to distinguish from preset click.
    // Let's rely on `isCustom`: if user is in custom mode (no preset matched), save.
    // But `activePreset` is derived from `accentColor`.
    // If user picks a custom color identical to a preset, it becomes a preset. That's fine.
    
    // We only save if the debounced color is the one currently active in UI.
    if (debouncedCustomColor === accentColor) {
       // Check if it's already saved? No, mutation is cheap enough.
       // Only save if it's not a preset we just clicked? 
       // If we clicked a preset, handlePresetSelect saved it.
       // If we dragged custom picker, accentColor updated, then debounce updated.
       // We can just save it.
       
       // Optimization: if it is a preset, we might have already saved it in handlePresetSelect.
       // But it doesn't hurt to save again.
       setThemeColor({ themeColor: debouncedCustomColor });
    }
  }, [debouncedCustomColor, accentColor, setThemeColor]);

  const handleReset = () => {
    setAccentColor(null);
    setThemeColor({ themeColor: null });
    setCustomColor("#8311d4");
  };

  const currentPalette = generateThemePalette(accentColor || "#8311d4");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">
          {t("theme")}
        </h3>
        <SecondaryButton
          onClick={handleReset}
          className="h-8 min-h-0 w-auto px-3 text-xs"
          fullWidth={false}
        >
          {t("themeReset")}
        </SecondaryButton>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">
          {t("themePresets")}
        </label>
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-8">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => handlePresetSelect(preset.hex)}
              className={cn(
                "group relative flex aspect-square w-full items-center justify-center rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                accentColor === preset.hex
                  ? "border-primary"
                  : "border-transparent",
              )}
              title={t(`colors.${preset.key}`)}
            >
              <span
                className="h-full w-full rounded-full border border-white/10"
                style={{ backgroundColor: preset.hex }}
              />
              {accentColor === preset.hex && (
                <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">
          {t("themeCustom")}
        </label>
        <div className="flex items-center gap-4">
          <div className="relative flex aspect-square h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 overflow-hidden">
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColorChange(e.target.value)}
              className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-none bg-transparent p-0 opacity-0"
              aria-label={t("themeCustom")}
            />
            <div
              className="h-full w-full"
              style={{ backgroundColor: customColor }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary uppercase">
              {customColor}
            </span>
            <span className="text-xs text-text-tertiary">
              {isCustom ? t("themeCustom") : t("themePresets")}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-text-secondary">
          {t("themePreview")}
        </label>
        <div className="grid grid-cols-5 h-16 w-full overflow-hidden rounded-lg border border-white/10">
          <div
            className="flex items-center justify-center text-xs font-medium text-white/80"
            style={{ backgroundColor: currentPalette["--app-bg"] }}
          >
            BG
          </div>
          <div
            className="flex items-center justify-center text-xs font-medium text-white/80"
            style={{ backgroundColor: currentPalette["--app-surface"] }}
          >
            Surface
          </div>
          <div
            className="flex items-center justify-center text-xs font-medium text-white/80"
            style={{ backgroundColor: currentPalette["--app-primary"] }}
          >
            Primary
          </div>
          <div
            className="flex items-center justify-center text-xs font-medium text-white/80"
            style={{ backgroundColor: currentPalette["--app-primary-dark"] }}
          >
            Dark
          </div>
          <div
            className="flex items-center justify-center text-xs font-medium text-white/80"
            style={{ backgroundColor: currentPalette["--app-primary-light"] }}
          >
            Light
          </div>
        </div>
      </div>
    </div>
  );
}
