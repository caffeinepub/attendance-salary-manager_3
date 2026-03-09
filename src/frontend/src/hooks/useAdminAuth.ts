import { useCallback, useState } from "react";

const CREDS_KEY = "attendpay_admin_creds";
const SESSION_KEY = "attendpay_admin_session";

interface StoredCreds {
  username: string;
  passwordHash: string;
}

function hashPassword(username: string, password: string): string {
  return btoa(`${username}:${password}`);
}

function getStoredCreds(): StoredCreds | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCreds;
  } catch {
    return null;
  }
}

function isSessionActive(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function useAdminAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    isSessionActive(),
  );

  const hasCredentials = Boolean(getStoredCreds());

  const setupCredentials = useCallback((username: string, password: string) => {
    const creds: StoredCreds = {
      username: username.trim(),
      passwordHash: hashPassword(username.trim(), password),
    };
    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    const creds = getStoredCreds();
    if (!creds) return false;
    const hash = hashPassword(username.trim(), password);
    if (creds.username === username.trim() && creds.passwordHash === hash) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setIsLoggedIn(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
  }, []);

  return {
    hasCredentials,
    isLoggedIn,
    setupCredentials,
    login,
    logout,
  };
}
