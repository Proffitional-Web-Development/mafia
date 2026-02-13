"use client";

import { DocumentLocaleSync } from "@/components/document-locale-sync";
import { useDirection } from "@/hooks/use-direction";

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const direction = useDirection();

  return (
    <div dir={direction} className="min-h-screen">
      <DocumentLocaleSync />
      {children}
    </div>
  );
}
