"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { changeOwnPassword, type ChangePasswordState } from "@/actions/account";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";

const initialState: ChangePasswordState = { success: false };

const INPUT_CLASS = "rounded-md border border-foreground/20 bg-background px-3 py-2 text-base";

interface ChangePasswordFormProps {
  email: string;
  locale: Locale;
}

function SubmitButton({ t }: { t: TranslateFn }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? t("account.saving") : t("account.changePassword")}
    </button>
  );
}

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  minLength?: number;
}

function PasswordField({ id, name, label, autoComplete, minLength }: PasswordFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-foreground/60">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="password"
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className={INPUT_CLASS}
      />
    </div>
  );
}

export function ChangePasswordForm({ email, locale }: ChangePasswordFormProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [state, formAction] = useActionState(changeOwnPassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex max-w-md flex-col gap-3 rounded-lg border border-foreground/10 p-4"
    >
      <h2 className="text-sm font-medium">{t("account.passwordHeading")}</h2>
      {/* Disabled: users can't change their own email, and a disabled field is never submitted. */}
      <div className="flex flex-col gap-1">
        <label htmlFor="account-email" className="text-xs font-medium text-foreground/60">
          {t("account.email")}
        </label>
        <input
          id="account-email"
          type="email"
          value={email}
          disabled
          autoComplete="username"
          className="cursor-not-allowed rounded-md border border-foreground/10 bg-foreground/10 px-3 py-2 text-base text-foreground/50"
        />
      </div>
      <PasswordField
        id="current-password"
        name="currentPassword"
        label={t("account.currentPassword")}
        autoComplete="current-password"
      />
      <PasswordField
        id="new-password"
        name="newPassword"
        label={t("account.newPassword")}
        autoComplete="new-password"
        minLength={8}
      />
      <PasswordField
        id="confirm-password"
        name="confirmPassword"
        label={t("account.confirmPassword")}
        autoComplete="new-password"
        minLength={8}
      />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-600 dark:text-green-400">{t("account.passwordChanged")}</p>
      ) : null}

      <div>
        <SubmitButton t={t} />
      </div>
    </form>
  );
}
