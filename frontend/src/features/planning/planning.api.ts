import { api } from "@/lib/api";
import type {
  DebtStrategyType,
  MonthlyPlanResponse,
  SafetyBufferType
} from "@/features/planning/planning.types";

export interface MonthlyPlanParams {
  month: string;
  safetyBufferType: SafetyBufferType;
  safetyBufferValue: number;
  strategyType: DebtStrategyType;
  maxMonths: number;
}

export async function getMonthlyPlan(
  params: MonthlyPlanParams
): Promise<MonthlyPlanResponse> {
  const response = await api.get<MonthlyPlanResponse>("/planning/monthly-plan", {
    params: {
      month: params.month,
      safety_buffer_type: params.safetyBufferType,
      safety_buffer_value: params.safetyBufferValue,
      strategy_type: params.strategyType,
      max_months: params.maxMonths
    }
  });

  return response.data;
}