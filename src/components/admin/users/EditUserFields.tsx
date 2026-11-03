import type { TranslateFn } from "@/lib/i18n/translations";
import type { AdminUserRow } from "@/types/admin";

interface EditUserFieldsProps {
  user: AdminUserRow;
  t: TranslateFn;
}

export function EditUserFields({ user, t }: EditUserFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={`name-${user.id}`} className="text-xs font-medium text-foreground/60">
          {t("adminUsers.name")}
        </label>
        <input
          id={`name-${user.id}`}
          name="name"
          defaultValue={user.name}
          required
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`email-${user.id}`} className="text-xs font-medium text-foreground/60">
          {t("adminUsers.email")}
        </label>
        <input
          id={`email-${user.id}`}
          name="email"
          type="email"
          defaultValue={user.email}
          required
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`role-${user.id}`} className="text-xs font-medium text-foreground/60">
          {t("adminUsers.role")}
        </label>
        <select
          id={`role-${user.id}`}
          name="role"
          defaultValue={user.role}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
        >
          <option value="VEHICLE_USER">{t("adminUsers.roleVehicleUser")}</option>
          <option value="ADMIN">{t("adminUsers.roleAdmin")}</option>
        </select>
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`newPassword-${user.id}`} className="text-xs font-medium text-foreground/60">
          {t("adminUsers.newPassword")}
        </label>
        <input
          id={`newPassword-${user.id}`}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
        />
      </div>
    </div>
  );
}
