"use client";

import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  function onChange(nextLocale: AppLocale) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      <span>{t("language")}</span>
      <select
        value={locale}
        onChange={(event) => onChange(event.target.value as AppLocale)}
        className="rounded-md border px-2 py-1"
        aria-label={t("language")}
      >
        <option value="en">{t("english")}</option>
        <option value="ar">{t("arabic")}</option>
      </select>
    </label>
  );
}
