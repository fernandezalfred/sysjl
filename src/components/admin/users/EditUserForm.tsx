"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateUser, type ActionState } from "@/actions/admin-users";
import { EditUserFields } from "@/components/admin/users/EditUserFields";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { AdminUserRow } from "@/types/admin";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { localizeError } from "@/lib/i18n/errors";
import { useSuccessToast } from "@/hooks/useSuccessToast";

const initialState: ActionState = { success: false };

function SubmitButton({ t, pending }: { t: TranslateFn; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? t("adminUsers.saving") : t("adminUsers.saveChanges")}
    </button>
  );
}

interface EditUserFormProps {
  user: AdminUserRow;
  locale: Locale;
}

export function EditUserForm({ user, locale }: EditUserFormProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [state, formAction, pending] = useActionState(updateUser, initialState);
  const handleSubmit = useSubmitWithoutReset(formAction);
  useSuccessToast(state, t("adminUsers.saved"));
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields only after a successful save; on an error they keep what was typed.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={user.id} />

      {/* Keyed on the user's data so these uncontrolled inputs' defaultValue
          resync after a save or deactivate revalidates the page — but keyed
          only on this inner piece, not the form, so useActionState's
          error message (below) survives the remount. */}
      <EditUserFields key={JSON.stringify(user)} user={user} t={t} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {localizeError(t, state.error)}
        </p>
      ) : null}

      <div>
        <SubmitButton t={t} pending={pending} />
      </div>
    </form>
  );
}
