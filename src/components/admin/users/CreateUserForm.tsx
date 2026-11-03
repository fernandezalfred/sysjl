"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createUser, type ActionState } from "@/actions/admin-users";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";

const initialState: ActionState = { success: false };

function SubmitButton({ t }: { t: TranslateFn }) {
  const { pending } = useFormStatus();
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
  const [state, formAction] = useActionState(createUser, initialState);

  return (
    <details className="rounded-lg border border-foreground/10 p-4">
      <summary className="cursor-pointer text-sm font-medium">{t("adminUsers.createNew")}</summary>
      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-name" className="text-xs font-medium text-foreground/60">
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
            <label htmlFor="new-email" className="text-xs font-medium text-foreground/60">
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
            <label htmlFor="new-password" className="text-xs font-medium text-foreground/60">
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
            <label htmlFor="new-role" className="text-xs font-medium text-foreground/60">
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
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-green-600 dark:text-green-400">{t("adminUsers.userCreated")}</p>
        ) : null}

        <div>
          <SubmitButton t={t} />
        </div>
      </form>
    </details>
  );
}
