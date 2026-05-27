export type IncomeType = "regular" | "irregular";

export interface Income {
  id: number;
  amount: string;
  date: string;
  category: string;
  type: IncomeType;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIncomePayload {
  amount: number;
  date: string;
  category: string;
  type: IncomeType;
  comment?: string | null;
}

export interface UpdateIncomePayload {
  amount?: number;
  date?: string;
  category?: string;
  type?: IncomeType;
  comment?: string | null;
}