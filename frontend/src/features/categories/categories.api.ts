import { api } from "@/lib/api";
import type {
  Category,
  CategoryType,
  CreateCategoryPayload,
  UpdateCategoryPayload
} from "@/features/categories/categories.types";

export interface CategoryListParams {
  type?: CategoryType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export async function getCategories(params?: CategoryListParams): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories", {
    params: {
      type: params?.type,
      is_active: params?.isActive,
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0
    }
  });

  return response.data;
}

export async function createCategory(
  payload: CreateCategoryPayload
): Promise<Category> {
  const response = await api.post<Category>("/categories", payload);
  return response.data;
}

export async function updateCategory(
  categoryId: number,
  payload: UpdateCategoryPayload
): Promise<Category> {
  const response = await api.put<Category>(`/categories/${categoryId}`, payload);
  return response.data;
}

export async function deleteCategory(categoryId: number): Promise<void> {
  await api.delete(`/categories/${categoryId}`);
}