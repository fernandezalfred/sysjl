"use client";

import { useActionState, useEffect, useRef } from "react";
import { createUser, type ActionState } from "@/actions/admin-users";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";

const initialState: ActionState = { success: false };

function SubmitButton({ t, pending }: { t: TranslateFn; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? t("adminUsers.creating") : t("adminUsers.createButton")}
    </button>
  );
}

interface CreateUserFormProps {
  locale: Locale;
}

export function CreateUserForm({ locale }: CreateUserFormProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [state, formAction, pending] = useActionState(createUser, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields only after a successful save; on an error they keep what was typed.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <details className="rounded-lg border border-foreground/10 p-4">
      <summary className="cursor-pointer text-sm font-medium">{t("adminUsers.createNew")}</summary>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-name" className="text-xs font-medium text-foreground/70">
              {t("adminUsers.name")}
            </label>
            <input
              id="new-name"
              name="name"
              required
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-email" className="text-xs font-medium text-foreground/70">
              {t("adminUsers.email")}
            </label>
            <input
              id="new-email"
              name="email"
              type="email"
              required
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-password" className="text-xs font-medium text-foreground/70">
              {t("adminUsers.password")}
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-role" className="text-xs font-medium text-foreground/70">
              {t("adminUsers.role")}
            </label>
            <select
              id="new-role"
              name="role"
              defaultValue="VEHICLE_USER"
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
            >
              <option value="VEHICLE_USER">{t("adminUsers.roleVehicleUser")}</option>
              <option value="ADMIN">{t("adminUsers.roleAdmin")}</option>
            </select>
          </div>
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {localizeError(t, state.error)}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-green-600 dark:text-green-400">{t("adminUsers.userCreated")}</p>
        ) : null}

        <div>
          <SubmitButton t={t} pending={pending} />
        </div>
      </form>
    </details>
  );
}
