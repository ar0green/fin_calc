import { api } from "@/lib/api";
import type {
  CreateDebtPayload,
  Debt,
  UpdateDebtPayload
} from "@/features/debts/debts.types";

export interface DebtListParams {
  isActive?: boolean;
  debtType?: string;
  limit?: number;
  offset?: number;
}

export async function getDebts(params?: DebtListParams): Promise<Debt[]> {
  const response = await api.get<Debt[]>("/debts", {
    params: {
      is_active: params?.isActive,
      debt_type: params?.debtType,
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0
    }
  });

  return response.data;
}

export async function createDebt(payload: CreateDebtPayload): Promise<Debt> {
  const response = await api.post<Debt>("/debts", payload);
  return response.data;
}

export async function updateDebt(
  debtId: number,
  payload: UpdateDebtPayload
): Promise<Debt> {
  const response = await api.put<Debt>(`/debts/${debtId}`, payload);
  return response.data;
}

export async function deleteDebt(debtId: number): Promise<void> {
  await api.delete(`/debts/${debtId}`);
}