import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccess } from "@/lib/auth/access";
import { getCompanySummaries } from "@/lib/company-summaries";
import { getT } from "@/lib/i18n/server";
import { defaultT } from "@/lib/i18n/translations";
import { CreateCompanyForm } from "@/components/admin/companies/CreateCompanyForm";
import { CompanyList } from "@/components/admin/companies/CompanyList";

// Super admin only (src/proxy.ts and the check below): every company.
export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-sm text-foreground/60">{defaultT("common.loading")}</div>}>
      <CompaniesContent />
    </Suspense>
  );
}

async function CompaniesContent() {
  await connection();
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") redirect("/dashboard");

  const [companies, access, { t, locale }] = await Promise.all([getCompanySummaries(), getAccess(), getT()]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("header.companies")}</h1>
        <p className="text-sm text-foreground/70">{t("companies.subheading")}</p>
      </header>

      <CreateCompanyForm locale={locale} />

      <CompanyList
        companies={companies}
        activeCompanyId={access?.companyId ?? null}
        locale={locale}
      />
    </div>
  );
}
