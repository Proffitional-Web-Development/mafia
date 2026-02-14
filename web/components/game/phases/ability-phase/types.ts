import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type AbilityPhaseState = NonNullable<
  FunctionReturnType<typeof api.abilityPhase.getAbilityPhaseState>
>;

export type SheikhAbilityState = Extract<
  AbilityPhaseState,
  { roleView: "sheikh" }
>;

export type GirlAbilityState = Extract<AbilityPhaseState, { roleView: "girl" }>;
