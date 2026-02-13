"use client";

import { useLocale, useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "pill" | "icon";
  className?: string;
}

export function LanguageSwitcher({
  variant = "pill",
  className,
}: LanguageSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  function onChange(nextLocale: AppLocale) {
    router.replace(pathname, { locale: nextLocale });
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-label={t("language")}
        onClick={() => onChange(locale === "en" ? "ar" : "en")}
        className={cn(
          "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 text-text-secondary transition-colors hover:border-primary/40 hover:text-white",
          className,
        )}
      >
        <Icon name="language" variant="round" size="md" />
      </button>
    );
  }

  return (
    <fieldset
      className={cn(
        "inline-flex items-center rounded-full border border-white/15 bg-white/5 p-1",
        className,
      )}
      aria-label={t("language")}
    >
      <legend className="sr-only">{t("language")}</legend>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
          locale === "en"
            ? "bg-primary text-white"
            : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        {t("english")}
      </button>
      <button
        type="button"
        onClick={() => onChange("ar")}
        className={cn(
          "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
          locale === "ar"
            ? "bg-primary text-white"
            : "text-text-tertiary hover:text-text-secondary",
        )}
      >
        {t("arabic")}
      </button>
    </fieldset>
  );
}
