export interface AnalyticsPeriod {
  date_from: string;
  date_to: string;
}

export interface TopExpenseCategoryItem {
  category: string;
  amount: string;
  percent: string;
}

export interface AnalyticsOverview {
  period: AnalyticsPeriod;

  total_income: string;
  total_expenses: string;
  mandatory_expenses: string;
  variable_expenses: string;
  minimum_debt_payments: string;

  free_cash: string;
  debt_payoff_capacity: string;

  active_debt_balance: string;
  active_debt_count: number;
  debt_to_income_ratio_percent: string | null;

  top_expense_categories: TopExpenseCategoryItem[];
}

export interface IncomeExpenseByMonthItem {
  month: string;
  income: string;
  expenses: string;
  cashflow: string;
}

export interface IncomeExpenseByMonthResponse {
  period: AnalyticsPeriod;
  items: IncomeExpenseByMonthItem[];
}

export interface ExpenseStructureItem {
  category: string;
  amount: string;
  percent: string;
}

export interface ExpenseStructureResponse {
  period: AnalyticsPeriod;
  total_expenses: string;
  items: ExpenseStructureItem[];
}

export interface DebtDynamicsMonthItem {
  month_index: number;
  month_date: string;
  total_balance_start: string;
  total_interest_accrued: string;
  total_paid: string;
  total_balance_end: string;
  closed_debt_ids: number[];
}

export interface DebtDynamicsResponse {
  strategy_type: "snowball" | "avalanche";
  start_date: string;
  extra_monthly_payment: string;
  paid_off: boolean;
  payoff_date: string | null;
  months_simulated: number;
  initial_total_balance: string;
  final_total_balance: string;
  total_paid: string;
  total_interest_paid: string;
  items: DebtDynamicsMonthItem[];
}