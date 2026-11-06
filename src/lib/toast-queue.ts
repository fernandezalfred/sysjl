export interface ToastItem {
  id: number;
  message: string;
}

// At most this many confirmation messages are on screen at once; older ones go first.
export const MAX_TOASTS = 3;

export function addToast(toasts: ToastItem[], toast: ToastItem): ToastItem[] {
  return [...toasts, toast].slice(-MAX_TOASTS);
}

export function removeToast(toasts: ToastItem[], id: number): ToastItem[] {
  return toasts.filter((toast) => toast.id !== id);
}
