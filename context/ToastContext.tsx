"use client";
import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import Toast from "@/components/ui/Toast";

interface ToastItem {
  id: string;
  title: string;
  body: string;
  subtitle?: string;
}

interface ToastConfig {
  title: string;
  body: string;
  subtitle?: string;
}

interface ToastContextType {
  showToast: (config: ToastConfig) => void;
  showPointsToast: (points: number, action: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((config: ToastConfig) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, ...config }]);
  }, []);

  const showPointsToast = useCallback((points: number, action: string) => {
    showToast({
      title: "Vous avez gagné",
      body: `+${points} pts`,
      subtitle: `pour ${action}`,
    });
  }, [showToast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showPointsToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              title={toast.title}
              body={toast.body}
              subtitle={toast.subtitle}
              onDismiss={() => dismiss(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
