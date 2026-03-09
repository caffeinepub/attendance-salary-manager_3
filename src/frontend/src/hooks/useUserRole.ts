import { useAuth } from "./useAuthContext";

export type Role = "admin" | "guest";

export function useUserRole() {
  const { isLoggedIn } = useAuth();

  const role: Role = isLoggedIn ? "admin" : "guest";

  return {
    role,
    isAdmin: isLoggedIn,
    isGuest: !isLoggedIn,
    isLoading: false,
  };
}
