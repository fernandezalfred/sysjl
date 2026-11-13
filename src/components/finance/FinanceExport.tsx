"use client";

import { useState } from "react";
import { toCsv, type ReportTable } from "@/lib/reports";
import type { TranslateFn } from "@/lib/i18n/translations";

interface FinanceExportProps {
  // Built only when a button is pressed, from what's on screen.
  buildTables: () => ReportTable[];
  fileName: string;
  t: TranslateFn;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

// CSV and Excel downloads of the report, and the browser's print dialog (which also
// saves as PDF). The Excel writer is loaded only when it's used.
export function FinanceExport({ buildTables, fileName, t }: FinanceExportProps) {
  const [busy, setBusy] = useState(false);

  function exportCsv() {
    download(new Blob([toCsv(buildTables())], { type: "text/csv;charset=utf-8" }), `${fileName}.csv`);
  }

  async function exportExcel() {
    setBusy(true);
    try {
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const sheets = buildTables().map((table) => ({
        sheet: table.title.slice(0, 31),
        stickyRowsCount: 1,
        columns: table.header.map((_, i) => ({ width: i === 0 ? 28 : 16 })),
        data: [
          table.header.map((value) => ({ value, fontWeight: "bold" as const })),
          ...table.rows.map((row) =>
            row.map((value) => (typeof value === "number" ? { value, type: Number, format: "#,##0" } : { value })),
          ),
        ],
      }));
      await writeXlsxFile(sheets).toFile(`${fileName}.xlsx`);
    } finally {
      setBusy(false);
    }
  }

  const buttonClass =
    "inline-flex items-center justify-center gap-1.5 rounded-lg border border-foreground/15 px-3 py-2 text-sm font-medium transition hover:bg-foreground/5 disabled:opacity-60";

  return (
    <div role="group" aria-label={t("finance.export.label")} className="grid grid-cols-3 gap-2 sm:flex print:hidden">
      <button type="button" onClick={exportCsv} className={buttonClass}>
        <DownloadIcon />
        {t("finance.export.csv")}
      </button>
      <button type="button" onClick={exportExcel} disabled={busy} className={buttonClass}>
        <DownloadIcon />
        {t("finance.export.excel")}
      </button>
      <button type="button" onClick={() => window.print()} className={`${buttonClass} bg-foreground text-background hover:bg-foreground/90`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
          <path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2M6 14h12v7H6z" />
        </svg>
        {t("finance.export.print")}
      </button>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
      <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </svg>
  );
}
