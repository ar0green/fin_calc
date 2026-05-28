import { api } from "@/lib/api";
import type {
  CreateDebtPaymentPayload,
  DebtPayment,
  UpdateDebtPaymentPayload
} from "@/features/debt-payments/debt-payments.types";

export interface DebtPaymentListParams {
  debtId?: number;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export async function getDebtPayments(
  params?: DebtPaymentListParams
): Promise<DebtPayment[]> {
  const response = await api.get<DebtPayment[]>("/debt-payments", {
    params: {
      debt_id: params?.debtId,
      date_from: params?.dateFrom,
      date_to: params?.dateTo,
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0
    }
  });

  return response.data;
}

export async function createDebtPayment(
  payload: CreateDebtPaymentPayload
): Promise<DebtPayment> {
  const response = await api.post<DebtPayment>("/debt-payments", payload);
  return response.data;
}

export async function updateDebtPayment(
  paymentId: number,
  payload: UpdateDebtPaymentPayload
): Promise<DebtPayment> {
  const response = await api.put<DebtPayment>(
    `/debt-payments/${paymentId}`,
    payload
  );

  return response.data;
}

export async function deleteDebtPayment(paymentId: number): Promise<void> {
  await api.delete(`/debt-payments/${paymentId}`);
}