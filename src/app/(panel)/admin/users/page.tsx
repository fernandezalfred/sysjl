import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { UserList } from "@/components/admin/UserList";
import { getT } from "@/lib/i18n/server";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminUsersSkeleton />}>
      <AdminUsersContent />
    </Suspense>
  );
}

async function AdminUsersContent() {
  await connection();

  const [users, vehicles, { t, locale }] = await Promise.all([
    prisma.user.findMany({ include: { vehicle: true }, orderBy: { createdAt: "asc" } }),
    prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
    getT(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("adminUsers.heading")}</h1>
        <p className="text-sm text-foreground/60">{t("adminUsers.subheading")}</p>
      </header>

      <CreateUserForm locale={locale} />

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
        locale={locale}
      />
    </div>
  );
}

function AdminUsersSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading users…</div>;
}
