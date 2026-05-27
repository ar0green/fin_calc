export type DebtStrategyType = "snowball" | "avalanche";

export interface ScenarioCompareItem {
  strategy_type: DebtStrategyType;
  extra_monthly_payment: number;
}

export interface ScenarioCompareRequest {
  start_date: string;
  max_months: number;
  scenarios: ScenarioCompareItem[];
}

export interface ScenarioCompareResult {
  label: string;
  strategy_type: DebtStrategyType;
  extra_monthly_payment: string;
  months_simulated: number;
  paid_off: boolean;
  payoff_date: string | null;
  total_paid: string;
  total_interest_paid: string;
  total_overpayment: string;
  initial_total_balance: string;
  final_total_balance: string;
}

export interface ScenarioCompareDelta {
  base_label: string;
  compared_label: string;
  months_saved: number | null;
  interest_saved: string | null;
  total_paid_saved: string | null;
}

export interface ScenarioCompareResponse {
  start_date: string;
  max_months: number;
  baseline: ScenarioCompareResult;
  scenarios: ScenarioCompareResult[];
  deltas_vs_baseline: ScenarioCompareDelta[];
}

export interface DebtStrategyRequest {
  strategy_type: DebtStrategyType;
  start_date: string;
  extra_monthly_payment: number;
  max_months: number;
}

export interface DebtProjectionDebtResult {
  debt_id: number;
  debt_name: string;
  debt_type: string;
  initial_balance: string;
  payoff_month: number | null;
  payoff_date: string | null;
  total_paid: string;
  total_interest_paid: string;
}

export interface DebtProjectionMonthItem {
  month_index: number;
  month_date: string;
  total_balance_start: string;
  total_interest_accrued: string;
  total_paid: string;
  total_balance_end: string;
  closed_debt_ids: number[];
}

export interface DebtStrategyResponse {
  strategy_type: DebtStrategyType;
  start_date: string;
  extra_monthly_payment: string;
  months_simulated: number;
  paid_off: boolean;
  payoff_date: string | null;
  total_paid: string;
  total_interest_paid: string;
  total_overpayment: string;
  initial_total_balance: string;
  final_total_balance: string;
  debts: DebtProjectionDebtResult[];
  projection: DebtProjectionMonthItem[];
}