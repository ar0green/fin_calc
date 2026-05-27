import { useMutation } from "@tanstack/react-query";

import {
  calculateDebtStrategy,
  compareScenarios
} from "@/features/scenarios/scenarios.api";
import type {
  DebtStrategyRequest,
  ScenarioCompareRequest
} from "@/features/scenarios/scenarios.types";

export function useScenarioCompare() {
  return useMutation({
    mutationKey: ["scenarios", "compare"],
    mutationFn: (payload: ScenarioCompareRequest) => compareScenarios(payload)
  });
}

export function useDebtStrategyCalculation() {
  return useMutation({
    mutationKey: ["scenarios", "debt-strategy"],
    mutationFn: (payload: DebtStrategyRequest) => calculateDebtStrategy(payload)
  });
}