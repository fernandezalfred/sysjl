"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { addToast, removeToast, type ToastItem } from "@/lib/toast-queue";

const TOAST_DURATION_MS = 3000;

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Short confirmation messages ("Registro guardado.") shown at the bottom of the
// screen after a modal saves or deletes and closes, so the user knows it worked.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const showToast = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((current) => addToast(current, { id, message }));
    setTimeout(() => setToasts((current) => removeToast(current, id)), TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex max-w-sm items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-emerald-400 dark:text-emerald-600"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider.");
  return value;
}
