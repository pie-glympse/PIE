"use client";

import {
    createContext,
    useState,
    useEffect,
    useContext,
    useCallback,
} from "react";
import type { ReactNode } from "react";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: string | null;
} | null;

type UserContextType = {
  user: User;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

function clearLocalAuth() {
  try {
    const ls = globalThis.localStorage;
    if (typeof ls?.removeItem === "function") {
      ls.removeItem("token");
      ls.removeItem("user");
    }
  } catch {
    /* ignore */
  }
}

function cacheUserLocally(user: NonNullable<User>) {
  try {
    const ls = globalThis.localStorage;
    if (typeof ls?.setItem === "function") {
      ls.setItem("user", JSON.stringify(user));
    }
  } catch {
    /* ignore */
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }

    setUser(null);
    setToken(null);
    clearLocalAuth();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
            setToken(null);
            clearLocalAuth();
          }
          return;
        }

        const data = await response.json();
        if (!cancelled && data.user) {
          setUser(data.user);
          cacheUserLocally(data.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          clearLocalAuth();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <UserContext.Provider
      value={{ user, token, setUser, setToken, logout, isLoading }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUser doit être utilisé dans un UserProvider");
  return context;
}
