import type { TranslateFn } from "@/lib/i18n/translations";

interface PaginationProps {
  page: number;
  pageCount: number;
  setPage: (page: number) => void;
  t: TranslateFn;
}

const buttonClass =
  "min-h-11 rounded-md border border-foreground/20 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40";

// Previous / "Page X of Y" / Next. Renders nothing when everything fits on one page.
export function Pagination({ page, pageCount, setPage, t }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label={t("pagination.label")} className="flex items-center justify-between gap-3">
      <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1} className={buttonClass}>
        {t("pagination.previous")}
      </button>
      <p className="text-sm text-foreground/70">{t("pagination.pageOf", { page, pageCount })}</p>
      <button type="button" onClick={() => setPage(page + 1)} disabled={page >= pageCount} className={buttonClass}>
        {t("pagination.next")}
      </button>
    </nav>
  );
}
