import { useQuery } from "@tanstack/react-query";

import {
  getAnalyticsOverview,
  getDebtDynamics,
  getExpenseStructure,
  getIncomeExpenseByMonth,
  getDebtPaymentsSummary
} from "@/features/analytics/analytics.api";

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  overview: (dateFrom: string, dateTo: string) =>
    ["analytics", "overview", dateFrom, dateTo] as const,
  incomeExpenseByMonth: (dateFrom: string, dateTo: string) =>
    ["analytics", "income-expense-by-month", dateFrom, dateTo] as const,
  expenseStructure: (dateFrom: string, dateTo: string) =>
    ["analytics", "expense-structure", dateFrom, dateTo] as const,
  debtPaymentsSummary: (dateFrom: string, dateTo: string) =>
  ["analytics", "debt-payments-summary", dateFrom, dateTo] as const,
  debtDynamics: (
    startDate: string,
    strategyType: "snowball" | "avalanche",
    extraMonthlyPayment: number,
    maxMonths: number
  ) =>
    [
      "analytics",
      "debt-dynamics",
      startDate,
      strategyType,
      extraMonthlyPayment,
      maxMonths
    ] as const
};

export function useDebtPaymentsSummary(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.debtPaymentsSummary(dateFrom, dateTo),
    queryFn: () => getDebtPaymentsSummary({ dateFrom, dateTo })
  });
}

export function useAnalyticsOverview(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.overview(dateFrom, dateTo),
    queryFn: () => getAnalyticsOverview({ dateFrom, dateTo })
  });
}

export function useIncomeExpenseByMonth(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.incomeExpenseByMonth(dateFrom, dateTo),
    queryFn: () => getIncomeExpenseByMonth({ dateFrom, dateTo })
  });
}

export function useExpenseStructure(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: analyticsQueryKeys.expenseStructure(dateFrom, dateTo),
    queryFn: () => getExpenseStructure({ dateFrom, dateTo })
  });
}

export function useAnalyticsDebtDynamics(
  startDate: string,
  strategyType: "snowball" | "avalanche",
  extraMonthlyPayment: number,
  maxMonths: number
) {
  return useQuery({
    queryKey: analyticsQueryKeys.debtDynamics(
      startDate,
      strategyType,
      extraMonthlyPayment,
      maxMonths
    ),
    queryFn: () =>
      getDebtDynamics({
        startDate,
        strategyType,
        extraMonthlyPayment,
        maxMonths
      })
  });
}