import { setUserActive } from "@/actions/admin-users";
import { EditUserForm } from "@/components/admin/EditUserForm";
import type { AdminUserRow, AdminVehicleOption } from "@/types/admin";

const ROLE_LABELS: Record<AdminUserRow["role"], string> = {
  ADMIN: "Admin",
  VEHICLE_USER: "Vehicle user",
};

interface UserListItemProps {
  user: AdminUserRow;
  vehicles: AdminVehicleOption[];
}

export function UserListItem({ user, vehicles }: UserListItemProps) {
  const toggleActive = setUserActive.bind(null, user.id, !user.isActive);

  return (
    <li className="rounded-lg border border-foreground/10 p-3">
      <details>
        <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-medium">{user.name}</span>{" "}
            <span className="text-sm text-foreground/60">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-foreground/60">
            <span>{ROLE_LABELS[user.role]}</span>
            <span>{user.vehicleName ?? "No vehicle"}</span>
            <span className={user.isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </summary>

        <div className="mt-4 flex flex-col gap-4 border-t border-foreground/10 pt-4">
          <EditUserForm user={user} vehicles={vehicles} />

          <form action={toggleActive}>
            <button type="submit" className="text-sm text-foreground/60 underline hover:text-foreground">
              {user.isActive ? "Deactivate account" : "Reactivate account"}
            </button>
          </form>
        </div>
      </details>
    </li>
  );
}
