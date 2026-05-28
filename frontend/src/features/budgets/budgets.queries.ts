import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCategoryBudget,
  deleteCategoryBudget,
  getCategoryBudgets,
  getMonthlyBudgetSummary,
  updateCategoryBudget,
  type CategoryBudgetListParams
} from "@/features/budgets/budgets.api";
import type {
  CreateCategoryBudgetPayload,
  UpdateCategoryBudgetPayload
} from "@/features/budgets/budgets.types";
import { notify } from "@/lib/toast";

export const budgetsQueryKeys = {
  all: ["budgets"] as const,
  list: (params?: CategoryBudgetListParams) => ["budgets", "list", params] as const,
  monthlySummary: (month: string) => ["budgets", "monthly-summary", month] as const
};

async function invalidateBudgetData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: budgetsQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["analytics"] }),
    queryClient.invalidateQueries({ queryKey: ["planning"] })
  ]);
}

export function useCategoryBudgets(params?: CategoryBudgetListParams) {
  return useQuery({
    queryKey: budgetsQueryKeys.list(params),
    queryFn: () => getCategoryBudgets(params)
  });
}

export function useMonthlyBudgetSummary(month: string) {
  return useQuery({
    queryKey: budgetsQueryKeys.monthlySummary(month),
    queryFn: () => getMonthlyBudgetSummary(month),
    enabled: Boolean(month)
  });
}

export function useCreateCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryBudgetPayload) =>
      createCategoryBudget(payload),
    onSuccess: async () => {
      await invalidateBudgetData(queryClient);
      notify.success("Бюджет категории добавлен");
    },
    onError: () => {
      notify.error("Не удалось добавить бюджет категории");
    }
  });
}

export function useUpdateCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      budgetId,
      payload
    }: {
      budgetId: number;
      payload: UpdateCategoryBudgetPayload;
    }) => updateCategoryBudget(budgetId, payload),
    onSuccess: async () => {
      await invalidateBudgetData(queryClient);
      notify.success("Бюджет категории обновлён");
    },
    onError: () => {
      notify.error("Не удалось обновить бюджет категории");
    }
  });
}

export function useDeleteCategoryBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (budgetId: number) => deleteCategoryBudget(budgetId),
    onSuccess: async () => {
      await invalidateBudgetData(queryClient);
      notify.success("Бюджет категории удалён");
    },
    onError: () => {
      notify.error("Не удалось удалить бюджет категории");
    }
  });
}