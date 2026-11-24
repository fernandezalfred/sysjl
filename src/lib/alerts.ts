import Swal, { type SweetAlertOptions } from "sweetalert2";
import type { TranslateFn } from "@/lib/i18n/translations";
import { currentTheme } from "@/lib/theme";

// SweetAlert2 popups used across the app: confirmations, success toasts and action
// errors. Client-only (called from event handlers and effects). They follow the OS
// light / dark mode on screen like the rest of the app, and render on the browser's top layer so
// they show above an open <dialog> modal. A modal <dialog> makes everything outside
// it inert, so a popup that needs a click is placed inside the open dialog (if any).

const BUTTON = "mx-1 rounded-md px-4 py-2 text-sm font-medium";
const CANCEL_BUTTON = `${BUTTON} border border-foreground/20 hover:bg-foreground/10`;

const mixin = Swal.mixin({ topLayer: true, buttonsStyling: false, reverseButtons: true });

// Each popup in the mode on screen now (it can change after the page loads).
const popup = {
  fire: (options: SweetAlertOptions) => mixin.fire({ theme: currentTheme(), ...options }),
};

// Where a clickable popup goes: inside the open modal <dialog>, or the page.
function clickableTarget(): HTMLElement {
  return document.querySelector<HTMLDialogElement>("dialog[open]") ?? document.body;
}

// True while a popup is on screen; a modal checks it so Esc closes the popup, not the modal.
export function isAlertOpen(): boolean {
  return Swal.isVisible();
}

interface ConfirmOptions {
  // A destructive action: warning icon, red "Yes, delete" button, Cancel focused.
  danger?: boolean;
  // Confirm button label; defaults to "Yes, delete" (danger) or "Yes, continue".
  confirmText?: string;
}

// Asks the user to confirm `text`; resolves to true only when they press confirm.
export async function confirmAlert(t: TranslateFn, text: string, { danger = false, confirmText }: ConfirmOptions = {}): Promise<boolean> {
  const result = await popup.fire({
    target: clickableTarget(),
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

// The user has to fix something before going on (e.g. an incomplete form); resolves
// once they close it.
export async function warningAlert(t: TranslateFn, title: string, text: string): Promise<void> {
  await popup.fire({
    target: clickableTarget(),
    icon: "warning",
    title,
    text,
    confirmButtonText: t("alert.ok"),
    customClass: { confirmButton: `${BUTTON} bg-foreground text-background hover:opacity-90` },
  });
}

// A short how-to (e.g. the iPhone install steps); resolves once closed.
export async function infoAlert(t: TranslateFn, title: string, text: string): Promise<void> {
  await popup.fire({
    target: clickableTarget(),
    icon: "info",
    title,
    text,
    confirmButtonText: t("alert.ok"),
    customClass: { confirmButton: `${BUTTON} bg-foreground text-background hover:opacity-90` },
  });
}

// An action failed (`message` already in the user's language).
export function errorAlert(t: TranslateFn, message: string): void {
  void popup.fire({
    target: clickableTarget(),
    icon: "error",
    title: t("alert.errorTitle"),
    text: message,
    confirmButtonText: t("alert.ok"),
    customClass: { confirmButton: `${BUTTON} bg-foreground text-background hover:opacity-90` },
  });
}
