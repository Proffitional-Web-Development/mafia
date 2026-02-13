"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface RoleLogsPanelProps {
  gameId: Id<"games">;
  role: "mafia" | "citizen" | "sheikh" | "girl" | "boy";
}

export function RoleLogsPanel({ gameId, role }: RoleLogsPanelProps) {
  const t = useTranslations("ability");
  const [open, setOpen] = useState(false);

  const sheikhLogs = useQuery(
    api.abilityPhase.getSheikhInvestigationLog,
    role === "sheikh" ? { gameId } : "skip",
  );
  const girlLogs = useQuery(
    api.abilityPhase.getGirlProtectionLog,
    role === "girl" ? { gameId } : "skip",
  );

  if (role !== "sheikh" && role !== "girl") {
    return null;
  }

  const isSheikh = role === "sheikh";

  return (
    <section className="rounded-2xl border border-white/10 bg-surface/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">
          {isSheikh ? t("logs.investigationTitle") : t("logs.protectionTitle")}
        </h3>
        <SecondaryButton
          variant="ghost"
          fullWidth={false}
          icon={open ? "visibility_off" : "visibility"}
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? t("logs.hide") : t("logs.show")}
        </SecondaryButton>
      </div>

      {open ? (
        <div className="mt-3">
          {isSheikh ? (
            !sheikhLogs ? (
              <p className="text-xs text-text-muted">{t("logs.loading")}</p>
            ) : sheikhLogs.length === 0 ? (
              <p className="text-xs text-text-muted">{t("logs.empty")}</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto no-scrollbar">
                {sheikhLogs.map((log) => (
                  <li
                    key={`${log.round}-${log.targetPlayerId ?? "none"}-${log.timestamp}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs text-text-secondary">
                        {t("logs.round", { round: log.round })} · {log.targetUsername}
                      </p>
                    </div>
                    <Badge
                      variant="investigation-result"
                      resultTone={log.faction === "mafia" ? "mafia" : "innocent"}
                    >
                      {log.faction === "mafia"
                        ? t("result.mafia")
                        : t("result.citizens")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )
          ) : !girlLogs ? (
            <p className="text-xs text-text-muted">{t("logs.loading")}</p>
          ) : girlLogs.length === 0 ? (
            <p className="text-xs text-text-muted">{t("logs.empty")}</p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto no-scrollbar">
              {girlLogs.map((log) => (
                <li
                  key={`${log.round}-${log.targetPlayerId ?? "none"}-${log.timestamp}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs text-text-secondary">
                      {t("logs.round", { round: log.round })} · {log.targetUsername}
                    </p>
                  </div>

                  <span
                    className={
                      log.outcome === "successful"
                        ? "rounded-full border border-success/40 bg-success/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-success"
                        : "rounded-full border border-warning/40 bg-warning/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-warning"
                    }
                  >
                    {log.outcome === "successful"
                      ? t("logs.successful")
                      : t("logs.notUsed")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
