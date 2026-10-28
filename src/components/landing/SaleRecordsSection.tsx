"use client";

import { useRef, useState } from "react";
import { formatCurrency } from "@/lib/pricing";
import { formatShortDate } from "@/lib/dates";
import { CreateRecordForm } from "@/components/records/CreateRecordForm";
import { EditRecordForm } from "@/components/records/EditRecordForm";
import type { DailyRecordRow, ProductBreakdown } from "@/types/landing";
import type { DailyWorkRecordRow } from "@/types/records";

interface SaleRecordsSectionProps {
  dailyRecords: DailyRecordRow[];
  currentUserId: string | null;
  isAdmin: boolean;
  vehicleUsers: { id: string; name: string }[];
}

type Mode = { type: "create" } | { type: "edit"; record: DailyWorkRecordRow };

function ProductCell({ breakdown }: { breakdown: ProductBreakdown }) {
  return (
    <>
      <div className="font-medium">{breakdown.sold} sold</div>
      <div className="text-xs text-foreground/60">
        {breakdown.taken} taken · {breakdown.remaining} left (
        {formatCurrency(breakdown.remainingValue)})
      </div>
    </>
  );
}

function TotalRevenueCell({ row }: { row: DailyRecordRow }) {
  const soldRevenue = row.queso.revenue + row.yogurt.revenue + row.milkMoteRevenue;
  const remainingValue = row.queso.remainingValue + row.yogurt.remainingValue;

  return (
    <>
      <div className="font-medium">{formatCurrency(soldRevenue)} sold</div>
      <div className="text-xs text-foreground/60">
        {formatCurrency(remainingValue)} left, value {formatCurrency(row.totalRevenue)}
      </div>
    </>
  );
}

function toEditableRecord(row: DailyRecordRow): DailyWorkRecordRow {
  return {
    id: row.workRecordId,
    date: row.date,
    quesoTaken: row.queso.taken,
    quesoSold: row.queso.sold,
    yogurtTaken: row.yogurt.taken,
    yogurtSold: row.yogurt.sold,
    totalSold: row.totalSold,
  };
}

export function SaleRecordsSection({
  dailyRecords,
  currentUserId,
  isAdmin,
  vehicleUsers,
}: SaleRecordsSectionProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<Mode>({ type: "create" });

  function openCreate() {
    setMode({ type: "create" });
    dialogRef.current?.showModal();
  }

  function openEdit(row: DailyRecordRow) {
    setMode({ type: "edit", record: toEditableRecord(row) });
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <section aria-labelledby="records-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          id="records-heading"
          className="text-sm font-medium uppercase tracking-wide text-foreground/60"
        >
          Sale Records
        </h2>
        {currentUserId ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
          >
            New record
          </button>
        ) : null}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-foreground/10 md:block">
        <table className="w-full text-sm">
          <thead className="bg-foreground/[0.03] text-left text-foreground/60">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">User</th>
              <th className="px-4 py-2 font-medium">Queso</th>
              <th className="px-4 py-2 font-medium">Yogurt</th>
              <th className="px-4 py-2 font-medium">Milk & Mote</th>
              <th className="px-4 py-2 font-medium">Total Revenue</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-foreground/10">
            {dailyRecords.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-2">{formatShortDate(row.date)}</td>
                <td className="px-4 py-2 font-medium">{row.userName}</td>
                <td className="px-4 py-2">
                  <ProductCell breakdown={row.queso} />
                </td>
                <td className="px-4 py-2">
                  <ProductCell breakdown={row.yogurt} />
                </td>
                <td className="px-4 py-2 font-medium">{formatCurrency(row.milkMoteRevenue)}</td>
                <td className="px-4 py-2">
                  <TotalRevenueCell row={row} />
                </td>
                <td className="px-4 py-2 text-right">
                  {isAdmin || row.userId === currentUserId ? (
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-sm text-foreground/60 underline hover:text-foreground"
                    >
                      Edit
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {dailyRecords.map((row) => (
          <li
            key={row.id}
            className="rounded-lg border border-foreground/10 p-3"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-medium">{row.userName}</span>
              <span className="text-xs text-foreground/60">
                {formatShortDate(row.date)}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-foreground/60">Queso</p>
                <ProductCell breakdown={row.queso} />
              </div>
              <div>
                <p className="text-xs text-foreground/60">Yogurt</p>
                <ProductCell breakdown={row.yogurt} />
              </div>
              <div>
                <p className="text-xs text-foreground/60">Milk & Mote</p>
                <div className="font-medium">{formatCurrency(row.milkMoteRevenue)}</div>
              </div>
            </div>
            <div className="mt-2 flex items-end justify-between border-t border-foreground/10 pt-2 text-sm">
              <div>
                <p className="text-xs text-foreground/60">Total Revenue</p>
                <TotalRevenueCell row={row} />
              </div>
              {isAdmin || row.userId === currentUserId ? (
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="text-sm text-foreground/60 underline hover:text-foreground"
                >
                  Edit
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="w-full max-w-md rounded-lg border border-foreground/10 bg-background p-6 text-foreground"
      >
        <h3 className="mb-4 text-sm font-medium">
          {mode.type === "create" ? "New record" : "Edit record"}
        </h3>
        {mode.type === "create" ? (
          <CreateRecordForm
            key="create"
            onSaved={close}
            onCancel={close}
            isAdmin={isAdmin}
            vehicleUsers={vehicleUsers}
          />
        ) : (
          <EditRecordForm key={mode.record.id} record={mode.record} onSaved={close} onCancel={close} />
        )}
      </dialog>
    </section>
  );
}
