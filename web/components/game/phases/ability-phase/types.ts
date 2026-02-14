import type { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type AbilityPhaseState = NonNullable<
  FunctionReturnType<typeof api.abilityPhase.getAbilityPhaseState>
>;

export type SheikhAbilityState = Extract<
  AbilityPhaseState,
  { roleView: "sheikh" }
>;

export type GirlAbilityState = Extract<
  AbilityPhaseState,
  { roleView: "girl" }
>;
