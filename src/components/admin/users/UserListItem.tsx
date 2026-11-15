import { EditUserForm } from "@/components/admin/users/EditUserForm";
import { ToggleUserActiveButton } from "@/components/admin/users/ToggleUserActiveButton";
import { PERMISSION_LABEL_KEYS } from "@/components/admin/users/RoleFields";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { AdminUserRow } from "@/types/admin";

interface UserListItemProps {
  user: AdminUserRow;
  canManageAdmins: boolean;
  locale: Locale;
}

export function UserListItem({ user, canManageAdmins, locale }: UserListItemProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const isAdmin = user.role === "ADMIN";
  const roleLabel = isAdmin ? t("adminUsers.roleAdmin") : t("adminUsers.roleVehicleUser");
  // A company admin sees the other admins but can't change them.
  const canEdit = canManageAdmins || !isAdmin;

  return (
    <li className="rounded-lg border border-foreground/10 p-3">
      <details>
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="font-medium">{user.name}</span>{" "}
            <span className="break-all text-sm text-foreground/70">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-foreground/70">
            <span>{roleLabel}</span>
            <span className={user.isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {user.isActive ? t("adminUsers.active") : t("adminUsers.inactive")}
            </span>
          </div>
        </summary>

        <div className="mt-4 flex flex-col gap-4 border-t border-foreground/10 pt-4">
          {isAdmin ? (
            <p className="text-xs text-foreground/70">
              {t("adminUsers.permissions")}:{" "}
              {user.permissions.length > 0
                ? user.permissions.map((p) => t(PERMISSION_LABEL_KEYS[p])).join(", ")
                : t("adminUsers.noPermissions")}
            </p>
          ) : null}
          {canEdit ? (
            <>
              <EditUserForm user={user} canManageAdmins={canManageAdmins} locale={locale} />
              <ToggleUserActiveButton user={user} locale={locale} />
            </>
          ) : (
            <p className="text-sm text-foreground/60">{t("adminUsers.onlySuperAdmin")}</p>
          )}
        </div>
      </details>
    </li>
  );
}
