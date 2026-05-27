import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createIncome,
  deleteIncome,
  getIncomes,
  updateIncome,
  type IncomeListParams
} from "@/features/incomes/incomes.api";
import type {
  CreateIncomePayload,
  UpdateIncomePayload
} from "@/features/incomes/incomes.types";

export const incomesQueryKeys = {
  all: ["incomes"] as const,
  list: (params?: IncomeListParams) => ["incomes", "list", params] as const
};

async function invalidateFinanceData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: incomesQueryKeys.all
    }),
    queryClient.invalidateQueries({
      queryKey: ["dashboard"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["analytics"]
    })
  ]);
}

export function useIncomes(params?: IncomeListParams) {
  return useQuery({
    queryKey: incomesQueryKeys.list(params),
    queryFn: () => getIncomes(params)
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateIncomePayload) => createIncome(payload),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
    }
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incomeId,
      payload
    }: {
      incomeId: number;
      payload: UpdateIncomePayload;
    }) => updateIncome(incomeId, payload),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
    }
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (incomeId: number) => deleteIncome(incomeId),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
    }
  });
}