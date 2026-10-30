"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateUser, type ActionState } from "@/actions/admin-users";
import { EditUserFields } from "@/components/admin/EditUserFields";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { AdminUserRow, AdminVehicleOption } from "@/types/admin";

const initialState: ActionState = { success: false };

function SubmitButton({ t }: { t: TranslateFn }) {
  const { pending } = useFormStatus();
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
  vehicles: AdminVehicleOption[];
  locale: Locale;
}

export function EditUserForm({ user, vehicles, locale }: EditUserFormProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [state, formAction] = useActionState(updateUser, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={user.id} />

      {/* Keyed on the user's data so these uncontrolled inputs' defaultValue
          resync after a save or deactivate revalidates the page — but keyed
          only on this inner piece, not the form, so useActionState's
          success/error message (below) survives the remount. */}
      <EditUserFields key={JSON.stringify(user)} user={user} vehicles={vehicles} t={t} />

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-600 dark:text-green-400">{t("adminUsers.saved")}</p>
      ) : null}

      <div>
        <SubmitButton t={t} />
      </div>
    </form>
  );
}
