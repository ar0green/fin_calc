export interface CategoryBudget {
  id: number;
  category: string;
  monthly_limit: string;
  start_month: string;
  is_active: boolean;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryBudgetPayload {
  category: string;
  monthly_limit: number;
  start_month: string;
  is_active: boolean;
  comment?: string | null;
}

export interface UpdateCategoryBudgetPayload {
  category?: string;
  monthly_limit?: number;
  start_month?: string;
  is_active?: boolean;
  comment?: string | null;
}

export interface BudgetCategorySummaryItem {
  category: string;
  budget_limit: string;
  actual_amount: string;
  remaining_amount: string;
  usage_percent: string;
  is_over_budget: boolean;
}

export interface MonthlyBudgetSummaryResponse {
  month: string;
  date_from: string;
  date_to: string;
  total_budget_limit: string;
  total_actual_amount: string;
  total_remaining_amount: string;
  total_usage_percent: string;
  items: BudgetCategorySummaryItem[];
}