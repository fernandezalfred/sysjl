"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCompany } from "@/actions/companies";
import type { ActionState } from "@/types/actions";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { useSuccessToast } from "@/hooks/useSuccessToast";
import { localizeError } from "@/lib/i18n/errors";

const initialState: ActionState = { success: false };

export function CreateCompanyForm({ locale }: { locale: Locale }) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [state, formAction, pending] = useActionState(createCompany, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  useSuccessToast(state, t("companies.created"));
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <details className="rounded-lg border border-foreground/10 p-4">
      <summary className="cursor-pointer text-sm font-medium">{t("companies.createNew")}</summary>
      <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:max-w-md">
        <div className="flex flex-col gap-1">
          <label htmlFor="new-company-name" className="text-xs font-medium text-foreground/70">
            {t("companies.name")}
          </label>
          <input
            id="new-company-name"
            name="name"
            required
            className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
          />
        </div>
        <p className="text-xs text-foreground/60">{t("companies.createHint")}</p>
        {state.error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {localizeError(t, state.error)}
          </p>
        ) : null}
        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            {pending ? t("companies.creating") : t("companies.createButton")}
          </button>
        </div>
      </form>
    </details>
  );
}
