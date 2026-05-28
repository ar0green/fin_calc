import { api } from "@/lib/api";
import type {
  CategoryBudget,
  CreateCategoryBudgetPayload,
  MonthlyBudgetSummaryResponse,
  UpdateCategoryBudgetPayload
} from "@/features/budgets/budgets.types";

export interface CategoryBudgetListParams {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export async function getCategoryBudgets(
  params?: CategoryBudgetListParams
): Promise<CategoryBudget[]> {
  const response = await api.get<CategoryBudget[]>("/budgets/category-budgets", {
    params: {
      is_active: params?.isActive,
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0
    }
  });

  return response.data;
}

export async function createCategoryBudget(
  payload: CreateCategoryBudgetPayload
): Promise<CategoryBudget> {
  const response = await api.post<CategoryBudget>(
    "/budgets/category-budgets",
    payload
  );

  return response.data;
}

export async function updateCategoryBudget(
  budgetId: number,
  payload: UpdateCategoryBudgetPayload
): Promise<CategoryBudget> {
  const response = await api.put<CategoryBudget>(
    `/budgets/category-budgets/${budgetId}`,
    payload
  );

  return response.data;
}

export async function deleteCategoryBudget(budgetId: number): Promise<void> {
  await api.delete(`/budgets/category-budgets/${budgetId}`);
}

export async function getMonthlyBudgetSummary(
  month: string
): Promise<MonthlyBudgetSummaryResponse> {
  const response = await api.get<MonthlyBudgetSummaryResponse>(
    "/budgets/monthly-summary",
    {
      params: {
        month
      }
    }
  );

  return response.data;
}