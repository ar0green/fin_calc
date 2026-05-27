import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/features/auth/auth.api";
import { getAccessToken, removeAccessToken } from "@/features/auth/auth.storage";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    enabled: Boolean(getAccessToken()),
    retry: false
  });
}

export function useLogout() {
  return () => {
    removeAccessToken();
    window.location.href = "/login";
  };
}