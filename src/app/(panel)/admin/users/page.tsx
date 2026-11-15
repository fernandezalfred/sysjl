import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePageAccess } from "@/lib/auth/access";
import { CreateUserForm } from "@/components/admin/users/CreateUserForm";
import { UserList } from "@/components/admin/users/UserList";
import { getT } from "@/lib/i18n/server";
import { defaultT } from "@/lib/i18n/translations";

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<AdminUsersSkeleton />}>
      <AdminUsersContent />
    </Suspense>
  );
}

async function AdminUsersContent() {
  await connection();
  const { companyId, isSuperAdmin } = await requirePageAccess("USERS");

  // The company's users; the super admin (no company) is never listed.
  const [users, { t, locale }] = await Promise.all([
    prisma.user.findMany({ where: { companyId }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
    getT(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("adminUsers.heading")}</h1>
        <p className="text-sm text-foreground/70">{t("adminUsers.subheading")}</p>
      </header>

      <CreateUserForm canManageAdmins={isSuperAdmin} locale={locale} />

      <UserList
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          permissions: u.permissions,
          isActive: u.isActive,
        }))}
        canManageAdmins={isSuperAdmin}
        locale={locale}
      />
    </div>
  );
}

function AdminUsersSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/60">{defaultT("adminUsers.loading")}</div>;
}
