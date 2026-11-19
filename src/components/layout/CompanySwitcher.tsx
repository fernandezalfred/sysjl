"use client";

import { useTransition } from "react";
import { setActiveCompany } from "@/actions/companies";
import { errorAlert } from "@/lib/alerts";
import { localizeError } from "@/lib/i18n/errors";
import type { TranslateFn } from "@/lib/i18n/translations";

export interface CompanyOption {
  id: string;
  name: string;
  isActive: boolean;
}

interface CompanySwitcherProps {
  companies: CompanyOption[];
  activeCompanyId: string | null;
  t: TranslateFn;
}

// Super admin: picks the company whose panel, finance, users and grains are shown.
export function CompanySwitcher({ companies, activeCompanyId, t }: CompanySwitcherProps) {
  const [pending, startTransition] = useTransition();

  if (companies.length === 0) return null;

  function handleChange(companyId: string) {
    startTransition(async () => {
      const result = await setActiveCompany(companyId);
      if (!result.success) errorAlert(t, localizeError(t, result.error ?? ""));
    });
  }

  return (
    <div className="mb-5 flex flex-col gap-1 rounded-xl border border-foreground/10 bg-background px-3 py-2">
      <label htmlFor="company-switcher" className="text-[11px] font-semibold uppercase tracking-wider text-foreground/45">
        {t("sidebar.switchCompany")}
      </label>
      <select
        id="company-switcher"
        value={activeCompanyId ?? ""}
        disabled={pending}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full cursor-pointer truncate rounded-md border border-foreground/15 bg-background px-2 py-1.5 text-base font-medium disabled:opacity-60 lg:text-sm"
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.isActive ? company.name : `${company.name} (${t("companies.inactive")})`}
          </option>
        ))}
      </select>
    </div>
  );
}
