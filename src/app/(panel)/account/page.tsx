import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getT } from "@/lib/i18n/server";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AccountPage() {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <AccountContent />
    </Suspense>
  );
}

async function AccountContent() {
  await connection();
  const [session, { t, locale }] = await Promise.all([auth(), getT()]);
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })
    : null;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("account.heading")}</h1>
        <p className="text-sm text-foreground/60">{t("account.subheading")}</p>
      </header>
      <ChangePasswordForm email={user?.email ?? ""} locale={locale} />
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-72 w-full max-w-md" />
    </div>
  );
}
