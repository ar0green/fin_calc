import { useQuery } from "@tanstack/react-query";

import {
  getAnalyticsOverview,
  getDebtDynamics,
  getIncomeExpenseByMonth
} from "@/features/dashboard/dashboard.api";

export function useAnalyticsOverview(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["dashboard", "overview", dateFrom, dateTo],
    queryFn: () => getAnalyticsOverview({ dateFrom, dateTo })
  });
}

export function useIncomeExpenseByMonth(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ["dashboard", "income-expense-by-month", dateFrom, dateTo],
    queryFn: () => getIncomeExpenseByMonth({ dateFrom, dateTo })
  });
}

export function useDebtDynamics(startDate: string) {
  return useQuery({
    queryKey: ["dashboard", "debt-dynamics", startDate],
    queryFn: () =>
      getDebtDynamics({
        startDate,
        strategyType: "avalanche",
        extraMonthlyPayment: 15000,
        maxMonths: 120
      })
  });
}