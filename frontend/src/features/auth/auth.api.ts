import { api } from "@/lib/api";
import type { LoginRequest, TokenResponse, User } from "@/types/auth";

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>("/auth/login", payload);
  return response.data;
}

export async function getMe(): Promise<User> {
  const response = await api.get<User>("/auth/me");
  return response.data;
}