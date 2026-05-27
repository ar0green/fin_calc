import { api } from "@/lib/api";
import type {
  DebtStrategyRequest,
  DebtStrategyResponse,
  ScenarioCompareRequest,
  ScenarioCompareResponse
} from "@/features/scenarios/scenarios.types";

export async function compareScenarios(
  payload: ScenarioCompareRequest
): Promise<ScenarioCompareResponse> {
  const response = await api.post<ScenarioCompareResponse>(
    "/calculations/scenario-compare",
    payload
  );

  return response.data;
}

export async function calculateDebtStrategy(
  payload: DebtStrategyRequest
): Promise<DebtStrategyResponse> {
  const response = await api.post<DebtStrategyResponse>(
    "/calculations/debt-strategy",
    payload
  );

  return response.data;
}