"use client";

import { useLocale } from "next-intl";

export function getDirection(locale: string): "rtl" | "ltr" {
  return locale.startsWith("ar") ? "rtl" : "ltr";
}

export function useDirection(): "rtl" | "ltr" {
  const locale = useLocale();
  return getDirection(locale);
}
