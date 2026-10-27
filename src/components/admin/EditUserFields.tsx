import type { AdminUserRow, AdminVehicleOption } from "@/types/admin";

interface EditUserFieldsProps {
  user: AdminUserRow;
  vehicles: AdminVehicleOption[];
}

export function EditUserFields({ user, vehicles }: EditUserFieldsProps) {
  const availableVehicles = vehicles.filter(
    (v) => v.assignedUserId === null || v.assignedUserId === user.id,
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1">
        <label htmlFor={`name-${user.id}`} className="text-xs font-medium text-foreground/60">
          Name
        </label>
        <input
          id={`name-${user.id}`}
          name="name"
          defaultValue={user.name}
          required
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`email-${user.id}`} className="text-xs font-medium text-foreground/60">
          Email
        </label>
        <input
          id={`email-${user.id}`}
          name="email"
          type="email"
          defaultValue={user.email}
          required
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`role-${user.id}`} className="text-xs font-medium text-foreground/60">
          Role
        </label>
        <select
          id={`role-${user.id}`}
          name="role"
          defaultValue={user.role}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        >
          <option value="VEHICLE_USER">Vehicle user</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`vehicle-${user.id}`} className="text-xs font-medium text-foreground/60">
          Vehicle
        </label>
        <select
          id={`vehicle-${user.id}`}
          name="vehicleId"
          defaultValue={user.vehicleId ?? ""}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        >
          <option value="">No vehicle</option>
          {availableVehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor={`newPassword-${user.id}`} className="text-xs font-medium text-foreground/60">
          New password (leave blank to keep current)
        </label>
        <input
          id={`newPassword-${user.id}`}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
