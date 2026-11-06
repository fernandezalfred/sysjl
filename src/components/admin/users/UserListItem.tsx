import { setUserActive } from "@/actions/admin-users";
import { EditUserForm } from "@/components/admin/users/EditUserForm";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { AdminUserRow } from "@/types/admin";

interface UserListItemProps {
  user: AdminUserRow;
  locale: Locale;
}

export function UserListItem({ user, locale }: UserListItemProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const toggleActive = setUserActive.bind(null, user.id, !user.isActive);
  const roleLabel = user.role === "ADMIN" ? t("adminUsers.roleAdmin") : t("adminUsers.roleVehicleUser");

  return (
    <li className="rounded-lg border border-foreground/10 p-3">
      <details>
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-medium">{user.name}</span>{" "}
            <span className="text-sm text-foreground/70">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-foreground/70">
            <span>{roleLabel}</span>
            <span className={user.isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {user.isActive ? t("adminUsers.active") : t("adminUsers.inactive")}
            </span>
          </div>
        </summary>

        <div className="mt-4 flex flex-col gap-4 border-t border-foreground/10 pt-4">
          <EditUserForm user={user} locale={locale} />

          <form action={toggleActive}>
            <button type="submit" className="text-sm text-foreground/70 underline hover:text-foreground">
              {user.isActive ? t("adminUsers.deactivate") : t("adminUsers.reactivate")}
            </button>
          </form>
        </div>
      </details>
    </li>
  );
}
