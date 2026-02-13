"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { useDirection } from "@/hooks/use-direction";

export function DocumentLocaleSync() {
  const locale = useLocale();
  const direction = useDirection();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);

  return null;
}
