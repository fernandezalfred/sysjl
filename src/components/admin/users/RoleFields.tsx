"use client";

import { useState } from "react";
import type { AdminPermission, Role } from "@prisma/client";
import { ADMIN_PERMISSIONS } from "@/lib/auth/permissions";
import type { DictionaryKey, TranslateFn } from "@/lib/i18n/translations";

export const PERMISSION_LABEL_KEYS: Record<AdminPermission, DictionaryKey> = {
  FINANCE: "header.finance",
  USERS: "header.manageUsers",
  GRAINS: "header.grains",
  PRICES: "adminProducts.heading",
};

interface RoleFieldsProps {
  idPrefix: string;
  defaultRole: Role;
  defaultPermissions: AdminPermission[];
  // Only the super admin makes admins and grants their modules; a company admin
  // creates sellers only.
  canManageAdmins: boolean;
  t: TranslateFn;
}

const labelClass = "text-xs font-medium text-foreground/70";

export function RoleFields({ idPrefix, defaultRole, defaultPermissions, canManageAdmins, t }: RoleFieldsProps) {
  const [role, setRole] = useState<Role>(defaultRole);

  if (!canManageAdmins) {
    return (
      <div className="flex flex-col gap-1">
        <span className={labelClass}>{t("adminUsers.role")}</span>
        <input type="hidden" name="role" value="VEHICLE_USER" />
        <p className="rounded-md border border-foreground/10 bg-foreground/[0.04] px-3 py-2 text-base text-foreground/70">
          {t("adminUsers.roleVehicleUser")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <label htmlFor={`${idPrefix}-role`} className={labelClass}>
          {t("adminUsers.role")}
        </label>
        <select
          id={`${idPrefix}-role`}
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
        >
          <option value="VEHICLE_USER">{t("adminUsers.roleVehicleUser")}</option>
          <option value="ADMIN">{t("adminUsers.roleAdmin")}</option>
        </select>
      </div>

      {role === "ADMIN" ? (
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className={labelClass}>{t("adminUsers.permissions")}</legend>
          <p className="text-xs text-foreground/60">{t("adminUsers.permissionsHint")}</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ADMIN_PERMISSIONS.map((permission) => (
              <label
                key={permission}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-foreground/15 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={permission}
                  defaultChecked={defaultPermissions.includes(permission)}
                  className="h-4 w-4 cursor-pointer"
                />
                {t(PERMISSION_LABEL_KEYS[permission])}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </>
  );
}
