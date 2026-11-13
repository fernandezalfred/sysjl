import Swal from "sweetalert2";
import type { TranslateFn } from "@/lib/i18n/translations";

// SweetAlert2 popups used across the app: confirmations, success toasts and action
// errors. Client-only (called from event handlers and effects). They follow the OS
// color scheme like the rest of the app, and render on the browser's top layer so
// they show above an open <dialog> modal.

const BUTTON = "mx-1 rounded-md px-4 py-2 text-sm font-medium";
const CANCEL_BUTTON = `${BUTTON} border border-foreground/20 hover:bg-foreground/10`;

const popup = Swal.mixin({ theme: "auto", topLayer: true, buttonsStyling: false, reverseButtons: true });

interface ConfirmOptions {
  // A destructive action: warning icon, red "Yes, delete" button, Cancel focused.
  danger?: boolean;
  // Confirm button label; defaults to "Yes, delete" (danger) or "Yes, continue".
  confirmText?: string;
}

// Asks the user to confirm `text`; resolves to true only when they press confirm.
export async function confirmAlert(t: TranslateFn, text: string, { danger = false, confirmText }: ConfirmOptions = {}): Promise<boolean> {
  const result = await popup.fire({
    icon: danger ? "warning" : "question",
    title: t("alert.confirmTitle"),
    text,
    showCancelButton: true,
    confirmButtonText: confirmText ?? (danger ? t("alert.delete") : t("alert.confirm")),
    cancelButtonText: t("alert.cancel"),
    focusCancel: danger,
    customClass: {
      confirmButton: `${BUTTON} text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-sky-600 hover:bg-sky-700"}`,
      cancelButton: CANCEL_BUTTON,
    },
  });
  return result.isConfirmed;
}

// Short confirmation that something was saved; closes on its own.
export function successToast(message: string): void {
  void popup.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}

// An action failed (`message` already in the user's language).
export function errorAlert(t: TranslateFn, message: string): void {
  void popup.fire({
    icon: "error",
    title: t("alert.errorTitle"),
    text: message,
    confirmButtonText: t("alert.ok"),
    customClass: { confirmButton: `${BUTTON} bg-foreground text-background hover:opacity-90` },
  });
}
