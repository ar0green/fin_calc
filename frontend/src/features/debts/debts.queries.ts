import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createDebt,
  deleteDebt,
  getDebts,
  updateDebt,
  type DebtListParams
} from "@/features/debts/debts.api";
import type {
  CreateDebtPayload,
  UpdateDebtPayload
} from "@/features/debts/debts.types";

export const debtsQueryKeys = {
  all: ["debts"] as const,
  list: (params?: DebtListParams) => ["debts", "list", params] as const
};

async function invalidateFinanceData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: debtsQueryKeys.all
    }),
    queryClient.invalidateQueries({
      queryKey: ["dashboard"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["analytics"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["scenarios"]
    })
  ]);
}

export function useDebts(params?: DebtListParams) {
  return useQuery({
    queryKey: debtsQueryKeys.list(params),
    queryFn: () => getDebts(params)
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDebtPayload) => createDebt(payload),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
    }
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      debtId,
      payload
    }: {
      debtId: number;
      payload: UpdateDebtPayload;
    }) => updateDebt(debtId, payload),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
    }
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (debtId: number) => deleteDebt(debtId),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
    }
  });
}