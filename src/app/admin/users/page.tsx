import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { UserList } from "@/components/admin/UserList";

export default function AdminUsersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<AdminUsersSkeleton />}>
        <AdminUsersContent />
      </Suspense>
    </div>
  );
}

async function AdminUsersContent() {
  await connection();

  const [users, vehicles] = await Promise.all([
    prisma.user.findMany({ include: { vehicle: true }, orderBy: { createdAt: "asc" } }),
    prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
        <p className="text-sm text-foreground/60">
          Create and edit accounts, assign vehicles to drivers, and deactivate accounts.
        </p>
      </header>

      <CreateUserForm />

      <UserList
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          vehicleId: u.vehicle?.id ?? null,
          vehicleName: u.vehicle?.name ?? null,
        }))}
        vehicles={vehicles.map((v) => ({ id: v.id, name: v.name, assignedUserId: v.userId }))}
      />
    </div>
  );
}

function AdminUsersSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading users…</div>;
}
