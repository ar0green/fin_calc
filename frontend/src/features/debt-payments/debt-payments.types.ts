export interface DebtPayment {
  id: number;
  debt_id: number;
  payment_date: string;

  amount: string;
  principal_amount: string;
  interest_amount: string;

  comment: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateDebtPaymentPayload {
  debt_id: number;
  payment_date: string;
  amount: number;
  principal_amount: number;
  interest_amount: number;
  comment?: string | null;
}

export interface UpdateDebtPaymentPayload {
  debt_id?: number;
  payment_date?: string;
  amount?: number;
  principal_amount?: number;
  interest_amount?: number;
  comment?: string | null;
}