import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
  type CategoryListParams
} from "@/features/categories/categories.api";
import type {
  CreateCategoryPayload,
  UpdateCategoryPayload
} from "@/features/categories/categories.types";
import { notify } from "@/lib/toast";

export const categoriesQueryKeys = {
  all: ["categories"] as const,
  list: (params?: CategoryListParams) => ["categories", "list", params] as const
};

export function useCategories(params?: CategoryListParams) {
  return useQuery({
    queryKey: categoriesQueryKeys.list(params),
    queryFn: () => getCategories(params)
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
      notify.success("Категория добавлена");
    },
    onError: () => {
      notify.error("Не удалось добавить категорию");
    }
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      payload
    }: {
      categoryId: number;
      payload: UpdateCategoryPayload;
    }) => updateCategory(categoryId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
      notify.success("Категория обновлена");
    },
    onError: () => {
      notify.error("Не удалось обновить категорию");
    }
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: number) => deleteCategory(categoryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
      notify.success("Категория удалена");
    },
    onError: () => {
      notify.error("Не удалось удалить категорию");
    }
  });
}