import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDebtPayment,
  deleteDebtPayment,
  getDebtPayments,
  updateDebtPayment,
  type DebtPaymentListParams
} from "@/features/debt-payments/debt-payments.api";
import type {
  CreateDebtPaymentPayload,
  UpdateDebtPaymentPayload
} from "@/features/debt-payments/debt-payments.types";
import { notify } from "@/lib/toast";

export const debtPaymentsQueryKeys = {
  all: ["debt-payments"] as const,
  list: (params?: DebtPaymentListParams) =>
    ["debt-payments", "list", params] as const
};

async function invalidateFinanceData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: debtPaymentsQueryKeys.all
    }),
    queryClient.invalidateQueries({
      queryKey: ["debts"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["dashboard"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["analytics"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["planning"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["scenarios"]
    })
  ]);
}

export function useDebtPayments(params?: DebtPaymentListParams) {
  return useQuery({
    queryKey: debtPaymentsQueryKeys.list(params),
    queryFn: () => getDebtPayments(params)
  });
}

export function useCreateDebtPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDebtPaymentPayload) => createDebtPayment(payload),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
      notify.success("Платёж по долгу добавлен");
    },
    onError: () => {
      notify.error("Не удалось добавить платёж по долгу");
    }
  });
}

export function useUpdateDebtPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      payload
    }: {
      paymentId: number;
      payload: UpdateDebtPaymentPayload;
    }) => updateDebtPayment(paymentId, payload),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
      notify.success("Платёж по долгу обновлён");
    },
    onError: () => {
      notify.error("Не удалось обновить платёж по долгу");
    }
  });
}

export function useDeleteDebtPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: number) => deleteDebtPayment(paymentId),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
      notify.success("Платёж по долгу удалён");
    },
    onError: () => {
      notify.error("Не удалось удалить платёж по долгу");
    }
  });
}