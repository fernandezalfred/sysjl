import { UserListItem } from "@/components/admin/UserListItem";
import type { AdminUserRow, AdminVehicleOption } from "@/types/admin";

interface UserListProps {
  users: AdminUserRow[];
  vehicles: AdminVehicleOption[];
}

export function UserList({ users, vehicles }: UserListProps) {
  return (
    <section aria-labelledby="users-heading" className="flex flex-col gap-3">
      <h2 id="users-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
        Users
      </h2>
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <UserListItem key={user.id} user={user} vehicles={vehicles} />
        ))}
      </ul>
    </section>
  );
}
