import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
  type ExpenseListParams
} from "@/features/expenses/expenses.api";
import type {
  CreateExpensePayload,
  UpdateExpensePayload
} from "@/features/expenses/expenses.types";
import { notify } from "@/lib/toast";

export const expensesQueryKeys = {
  all: ["expenses"] as const,
  list: (params?: ExpenseListParams) => ["expenses", "list", params] as const
};

async function invalidateFinanceData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: expensesQueryKeys.all
    }),
    queryClient.invalidateQueries({
      queryKey: ["dashboard"]
    }),
    queryClient.invalidateQueries({
      queryKey: ["analytics"]
    })
  ]);
}

export function useExpenses(params?: ExpenseListParams) {
  return useQuery({
    queryKey: expensesQueryKeys.list(params),
    queryFn: () => getExpenses(params)
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(payload),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
      notify.success("Расход добавлен");
    },
    onError: () => {
      notify.error("Не удалось добавить расход");
    }
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      expenseId,
      payload
    }: {
      expenseId: number;
      payload: UpdateExpensePayload;
    }) => updateExpense(expenseId, payload),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
      notify.success("Расход обновлён");
    },
    onError: () => {
      notify.error("Не удалось обновить расход");
    }
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: number) => deleteExpense(expenseId),
    onSuccess: async () => {
      await invalidateFinanceData(queryClient);
      notify.success("Расход удалён");
    },
    onError: () => {
      notify.error("Не удалось удалить расход");
    }
  });
}