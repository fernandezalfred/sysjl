"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { renameCompany, setActiveCompany, setCompanyActive } from "@/actions/companies";
import type { ActionState } from "@/types/actions";
import { confirmAlert, errorAlert, successToast } from "@/lib/alerts";
import { localizeError } from "@/lib/i18n/errors";
import { formatCurrency } from "@/lib/money/pricing";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { CompanySummary } from "@/lib/companies";
import { useSubmitWithoutReset } from "@/hooks/useSubmitWithoutReset";
import { useSuccessToast } from "@/hooks/useSuccessToast";

interface CompanyListProps {
  companies: CompanySummary[];
  activeCompanyId: string | null;
  locale: Locale;
}

export function CompanyList({ companies, activeCompanyId, locale }: CompanyListProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);

  if (companies.length === 0) {
    return <p className="text-sm text-foreground/70">{t("companies.none")}</p>;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} isOpen={company.id === activeCompanyId} t={t} />
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-foreground/60">{label}</span>
      <span className="text-base font-semibold tabular-nums">{value}</span>
    </div>
  );
}

const initialState: ActionState = { success: false };

function CompanyCard({ company, isOpen, t }: { company: CompanySummary; isOpen: boolean; t: TranslateFn }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [renameState, renameAction, renaming] = useActionState(renameCompany, initialState);
  const handleRename = useSubmitWithoutReset(renameAction);
  useSuccessToast(renameState, t("companies.renamed"));

  function open() {
    startTransition(async () => {
      const result = await setActiveCompany(company.id);
      if (!result.success) return errorAlert(t, localizeError(t, result.error ?? ""));
      router.push("/dashboard");
    });
  }

  async function toggleActive() {
    const activate = !company.isActive;
    const text = t(activate ? "companies.confirmReactivate" : "companies.confirmDeactivate", { name: company.name });
    const label = activate ? t("companies.reactivate") : t("companies.deactivate");
    if (!(await confirmAlert(t, text, { danger: !activate, confirmText: label }))) return;
    startTransition(async () => {
      const result = await setCompanyActive(company.id, activate);
      if (result.success) successToast(t(activate ? "companies.reactivated" : "companies.deactivated"));
      else errorAlert(t, localizeError(t, result.error ?? ""));
    });
  }

  return (
    <li className={`flex flex-col gap-4 rounded-xl border p-4 ${isOpen ? "border-sky-600/50 bg-sky-600/[0.04]" : "border-foreground/10"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{company.name}</p>
          <p className={`text-xs ${company.isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {company.isActive ? t("companies.active") : t("companies.inactive")}
            {isOpen ? <span className="text-foreground/60"> · {t("companies.current")}</span> : null}
          </p>
        </div>
        <button
          type="button"
          onClick={open}
          disabled={pending}
          className="min-h-10 rounded-md bg-foreground px-4 py-1.5 text-sm font-medium text-background disabled:opacity-60 sm:min-h-0 sm:px-3"
        >
          {t("companies.open")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("companies.sellers")} value={String(company.sellers)} />
        <Stat label={t("companies.admins")} value={String(company.admins)} />
        <Stat label={t("companies.recentNetProfit")} value={formatCurrency(company.recentNetProfit)} />
        <Stat label={t("companies.recentRecords")} value={String(company.recentRecords)} />
      </div>

      <details>
        <summary className="cursor-pointer py-1 text-sm text-foreground/70">{t("companies.edit")}</summary>
        <form onSubmit={handleRename} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="companyId" value={company.id} />
          <div className="flex flex-col gap-1">
            <label htmlFor={`company-name-${company.id}`} className="text-xs font-medium text-foreground/70">
              {t("companies.name")}
            </label>
            <input
              id={`company-name-${company.id}`}
              name="name"
              defaultValue={company.name}
              required
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-base"
            />
          </div>
          {renameState.error ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {localizeError(t, renameState.error)}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              disabled={renaming}
              className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
            >
              {renaming ? t("companies.saving") : t("companies.save")}
            </button>
            <button
              type="button"
              onClick={toggleActive}
              disabled={pending}
              className="text-sm text-foreground/70 underline hover:text-foreground disabled:opacity-60"
            >
              {company.isActive ? t("companies.deactivate") : t("companies.reactivate")}
            </button>
          </div>
        </form>
      </details>
    </li>
  );
}
