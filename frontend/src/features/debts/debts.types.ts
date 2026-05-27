export interface Debt {
  id: number;
  name: string;
  debt_type: string;
  principal_balance: string;
  annual_interest_rate: string;
  minimum_monthly_payment: string;
  due_day: number;
  early_repayment_allowed: boolean;
  payoff_priority: number;
  is_active: boolean;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDebtPayload {
  name: string;
  debt_type: string;
  principal_balance: number;
  annual_interest_rate: number;
  minimum_monthly_payment: number;
  due_day: number;
  early_repayment_allowed: boolean;
  payoff_priority: number;
  is_active: boolean;
  comment?: string | null;
}

export interface UpdateDebtPayload {
  name?: string;
  debt_type?: string;
  principal_balance?: number;
  annual_interest_rate?: number;
  minimum_monthly_payment?: number;
  due_day?: number;
  early_repayment_allowed?: boolean;
  payoff_priority?: number;
  is_active?: boolean;
  comment?: string | null;
}