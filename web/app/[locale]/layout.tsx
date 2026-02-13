import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { LocaleProvider } from "@/components/locale-provider";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "../../components/theme-provider";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const common = await getTranslations("common");

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleProvider>
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm"
          >
            {common("skipToContent")}
          </a>
          <div id="main-content">{children}</div>
        </ThemeProvider>
      </LocaleProvider>
    </NextIntlClientProvider>
  );
}
