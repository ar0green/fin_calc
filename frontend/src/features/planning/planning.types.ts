export type SafetyBufferType = "percent" | "fixed";
export type DebtStrategyType = "snowball" | "avalanche";

export interface MonthlyPlanPeriod {
  month: string;
  date_from: string;
  date_to: string;
}

export interface MonthlyPlanExpenseCategory {
  category: string;
  amount: string;
  percent: string;
}

export interface MonthlyPlanDebtItem {
  debt_id: number;
  name: string;
  debt_type: string;
  principal_balance: string;
  annual_interest_rate: string;
  minimum_monthly_payment: string;
  due_day: number;
  payoff_priority: number;
}

export interface MonthlyPlanScenarioImpact {
  strategy_type: DebtStrategyType;
  max_months: number;

  baseline_months_simulated: number;
  baseline_paid_off: boolean;
  baseline_payoff_date: string | null;
  baseline_total_interest_paid: string;
  baseline_total_paid: string;

  recommended_months_simulated: number;
  recommended_paid_off: boolean;
  recommended_payoff_date: string | null;
  recommended_total_interest_paid: string;
  recommended_total_paid: string;

  months_saved: number | null;
  interest_saved: string | null;
  total_paid_saved: string | null;
}

export interface MonthlyPlanResponse {
  period: MonthlyPlanPeriod;

  total_income: string;
  mandatory_expenses: string;
  variable_expenses: string;
  total_expenses: string;
  minimum_debt_payments: string;

  free_cash: string;
  debt_payoff_capacity: string;

  safety_buffer_type: SafetyBufferType;
  safety_buffer_value: string;
  safety_buffer: string;

  budget_overrun_total: string;
  recommended_extra_payment_before_budget_adjustment: string;
  budget_adjustment_applied: boolean;

  recommended_extra_payment: string;
  remaining_after_recommended_extra_payment: string;

  active_debt_balance: string;
  active_debt_count: number;

  recommended_debt_target_id: number | null;
  recommended_debt_target_name: string | null;

  scenario_impact: MonthlyPlanScenarioImpact | null;

  expense_categories: MonthlyPlanExpenseCategory[];
  active_debts: MonthlyPlanDebtItem[];
  income_regular: string;
  income_irregular: string;

  expenses_recurring: string;
  expenses_one_time: string;

  income_items: MonthlyPlanIncomeItem[];
  expense_items: MonthlyPlanExpenseItem[];
}

export interface PlanningSettings {
  month: string;
  safetyBufferType: SafetyBufferType;
  safetyBufferValue: number;
  strategyType: DebtStrategyType;
  maxMonths: number;
}

export type IncomeSourceType = "regular" | "irregular";
export type ExpenseRecurrenceType = "none" | "monthly";
export type ExpenseType = "mandatory" | "variable";

export interface MonthlyPlanIncomeItem {
  income_id: number;
  category: string;
  amount: string;
  source_type: IncomeSourceType;
  original_date: string;
  comment: string | null;
}

export interface MonthlyPlanExpenseItem {
  expense_id: number;
  category: string;
  amount: string;
  expense_type: ExpenseType;
  recurrence_type: ExpenseRecurrenceType;
  original_date: string;
  comment: string | null;
}