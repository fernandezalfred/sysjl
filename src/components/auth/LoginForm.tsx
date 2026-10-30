"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "@/actions/auth";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";

const initialState: LoginState = { success: false };

function SubmitButton({ t }: { t: TranslateFn }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
    >
      {pending ? t("login.submitting") : t("login.submit")}
    </button>
  );
}

interface LoginFormProps {
  locale: Locale;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [state, formAction] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          {t("login.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          {t("login.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <SubmitButton t={t} />
    </form>
  );
}
