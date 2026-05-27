import { api } from "@/lib/api";
import type {
  CreateExpensePayload,
  Expense,
  ExpenseType,
  RecurrenceType,
  UpdateExpensePayload
} from "@/features/expenses/expenses.types";

export interface ExpenseListParams {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  type?: ExpenseType;
  recurrenceType?: RecurrenceType;
  limit?: number;
  offset?: number;
}

export async function getExpenses(params?: ExpenseListParams): Promise<Expense[]> {
  const response = await api.get<Expense[]>("/expenses", {
    params: {
      date_from: params?.dateFrom,
      date_to: params?.dateTo,
      category: params?.category,
      type: params?.type,
      recurrence_type: params?.recurrenceType,
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0
    }
  });

  return response.data;
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const response = await api.post<Expense>("/expenses", payload);
  return response.data;
}

export async function updateExpense(
  expenseId: number,
  payload: UpdateExpensePayload
): Promise<Expense> {
  const response = await api.put<Expense>(`/expenses/${expenseId}`, payload);
  return response.data;
}

export async function deleteExpense(expenseId: number): Promise<void> {
  await api.delete(`/expenses/${expenseId}`);
}