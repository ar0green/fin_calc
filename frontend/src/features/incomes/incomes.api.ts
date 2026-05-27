import { api } from "@/lib/api";
import type { CreateIncomePayload, Income, UpdateIncomePayload } from "@/features/incomes/incomes.types";

export interface IncomeListParams {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  type?: "regular" | "irregular";
  limit?: number;
  offset?: number;
}

export async function getIncomes(params?: IncomeListParams): Promise<Income[]> {
  const response = await api.get<Income[]>("/incomes", {
    params: {
      date_from: params?.dateFrom,
      date_to: params?.dateTo,
      category: params?.category,
      type: params?.type,
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0
    }
  });

  return response.data;
}

export async function createIncome(payload: CreateIncomePayload): Promise<Income> {
  const response = await api.post<Income>("/incomes", payload);
  return response.data;
}

export async function updateIncome(
  incomeId: number,
  payload: UpdateIncomePayload
): Promise<Income> {
  const response = await api.put<Income>(`/incomes/${incomeId}`, payload);
  return response.data;
}

export async function deleteIncome(incomeId: number): Promise<void> {
  await api.delete(`/incomes/${incomeId}`);
}