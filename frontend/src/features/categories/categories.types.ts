export type CategoryType = "income" | "expense" | "both";

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  is_active: boolean;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
  is_active: boolean;
  comment?: string | null;
}

export interface UpdateCategoryPayload {
  name?: string;
  type?: CategoryType;
  is_active?: boolean;
  comment?: string | null;
}