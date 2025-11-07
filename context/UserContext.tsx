'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';

type User = { id: string; email: string; firstName: string; lastName: string; role: string; companyId?: string } | null;

type UserContextType = {
  user: User;
  token: string | null;
  setUser: (user: User) => void; // -> These errors are false positives because 'setUser' and 'setToken' are function type definitions in the context type, not unused variables. You can safely ignore the warnings !
  setToken: (token: string | null) => void;
  logout: () => void;
    isLoading: boolean;

};


const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);

const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (savedToken && savedUser) {
    setToken(savedToken);
    setUser(JSON.parse(savedUser));
  }
    setIsLoading(false);

}, []); // tableau vide = run only once on mount

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
<UserContext.Provider value={{ user, token, setUser, setToken, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser doit être utilisé dans un UserProvider");
  return context;
}
