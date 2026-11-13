"use client";

import { useTransition } from "react";
import { setUserActive } from "@/actions/admin-users";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { AdminUserRow } from "@/types/admin";

interface ToggleUserActiveButtonProps {
  user: AdminUserRow;
  locale: Locale;
}

// Deactivates (or reactivates) a user's account after a confirmation.
export function ToggleUserActiveButton({ user, locale }: ToggleUserActiveButtonProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [pending, startTransition] = useTransition();
  const activate = !user.isActive;

  async function handleClick() {
    const text = t(activate ? "adminUsers.confirmReactivate" : "adminUsers.confirmDeactivate", { name: user.name });
    const label = activate ? t("adminUsers.reactivate") : t("adminUsers.deactivate");
    if (!(await confirmAlert(t, text, { danger: !activate, confirmText: label }))) return;

    startTransition(async () => {
      try {
        await setUserActive(user.id, activate);
        successToast(t(activate ? "toast.userReactivated" : "toast.userDeactivated"));
      } catch {
        errorAlert(t, t("alert.unexpectedError"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="self-start text-sm text-foreground/70 underline hover:text-foreground disabled:opacity-60"
    >
      {user.isActive ? t("adminUsers.deactivate") : t("adminUsers.reactivate")}
    </button>
  );
}
