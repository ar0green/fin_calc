import { useQuery } from "@tanstack/react-query";

import {
  getMonthlyPlan,
  type MonthlyPlanParams
} from "@/features/planning/planning.api";

export const planningQueryKeys = {
  all: ["planning"] as const,
  monthlyPlan: (params: MonthlyPlanParams) =>
    ["planning", "monthly-plan", params] as const
};

export function useMonthlyPlan(params: MonthlyPlanParams) {
  return useQuery({
    queryKey: planningQueryKeys.monthlyPlan(params),
    queryFn: () => getMonthlyPlan(params),
    enabled: Boolean(params.month)
  });
}