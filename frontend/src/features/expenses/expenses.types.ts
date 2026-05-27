export type ExpenseType = "mandatory" | "variable";
export type RecurrenceType = "none" | "monthly";

export interface Expense {
  id: number;
  amount: string;
  date: string;
  category: string;
  type: ExpenseType;
  recurrence_type: RecurrenceType;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExpensePayload {
  amount: number;
  date: string;
  category: string;
  type: ExpenseType;
  recurrence_type: RecurrenceType;
  comment?: string | null;
}

export interface UpdateExpensePayload {
  amount?: number;
  date?: string;
  category?: string;
  type?: ExpenseType;
  recurrence_type?: RecurrenceType;
  comment?: string | null;
}