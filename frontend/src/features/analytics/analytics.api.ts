import { api } from "@/lib/api";
import type {
  AnalyticsOverview,
  DebtDynamicsResponse,
  ExpenseStructureResponse,
  IncomeExpenseByMonthResponse,
  DebtPaymentsSummaryResponse
} from "@/features/analytics/analytics.types";

export interface AnalyticsPeriodParams {
  dateFrom: string;
  dateTo: string;
}

export interface DebtDynamicsParams {
  startDate: string;
  strategyType?: "snowball" | "avalanche";
  extraMonthlyPayment?: number;
  maxMonths?: number;
}

export async function getAnalyticsOverview({
  dateFrom,
  dateTo
}: AnalyticsPeriodParams): Promise<AnalyticsOverview> {
  const response = await api.get<AnalyticsOverview>("/analytics/overview", {
    params: {
      date_from: dateFrom,
      date_to: dateTo
    }
  });

  return response.data;
}

export async function getDebtPaymentsSummary({
  dateFrom,
  dateTo
}: AnalyticsPeriodParams): Promise<DebtPaymentsSummaryResponse> {
  const response = await api.get<DebtPaymentsSummaryResponse>(
    "/analytics/debt-payments-summary",
    {
      params: {
        date_from: dateFrom,
        date_to: dateTo
      }
    }
  );

  return response.data;
}

export async function getIncomeExpenseByMonth({
  dateFrom,
  dateTo
}: AnalyticsPeriodParams): Promise<IncomeExpenseByMonthResponse> {
  const response = await api.get<IncomeExpenseByMonthResponse>(
    "/analytics/income-expense-by-month",
    {
      params: {
        date_from: dateFrom,
        date_to: dateTo
      }
    }
  );

  return response.data;
}

export async function getExpenseStructure({
  dateFrom,
  dateTo
}: AnalyticsPeriodParams): Promise<ExpenseStructureResponse> {
  const response = await api.get<ExpenseStructureResponse>(
    "/analytics/expense-structure",
    {
      params: {
        date_from: dateFrom,
        date_to: dateTo
      }
    }
  );

  return response.data;
}

export async function getDebtDynamics({
  startDate,
  strategyType = "avalanche",
  extraMonthlyPayment = 15000,
  maxMonths = 120
}: DebtDynamicsParams): Promise<DebtDynamicsResponse> {
  const response = await api.get<DebtDynamicsResponse>("/analytics/debt-dynamics", {
    params: {
      start_date: startDate,
      strategy_type: strategyType,
      extra_monthly_payment: extraMonthlyPayment,
      max_months: maxMonths
    }
  });

  return response.data;
}