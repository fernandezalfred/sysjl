import type { DailyRecordRow, DailyWorkRecordRow } from "@/types/daily-records";

export function toEditableRecord(row: DailyRecordRow): DailyWorkRecordRow {
  return {
    id: row.workRecordId,
    userName: row.userName,
    date: row.date,
    quesoTaken: row.queso.taken,
    quesoRemaining: row.queso.remaining,
    yogurtTaken: row.yogurt.taken,
    yogurtRemaining: row.yogurt.remaining,
    totalSold: row.totalSold,
    milkLiters: row.milkLiters,
    milkUnitCost: row.milkUnitCost,
  };
}

// What a new record starts with from the seller's previous one: the quantities taken and
// the Milk price; everything else (left over, Total venta) starts empty.
export interface NewRecordDefaults {
  quesoTaken: number;
  yogurtTaken: number;
  milkLiters: number;
  milkUnitCost: number;
}

function toDefaults(row: DailyRecordRow): NewRecordDefaults {
  return { quesoTaken: row.queso.taken, yogurtTaken: row.yogurt.taken, milkLiters: row.milkLiters, milkUnitCost: row.milkUnitCost };
}

// The starting values of a new record: `byUser` from each seller's most recently
// created record, `latest` from the most recently created record of all (shown before
// the admin picks a seller, and for a seller without records yet). null with no records.
export function newRecordDefaults(rows: DailyRecordRow[]): {
  byUser: Record<string, NewRecordDefaults>;
  latest: NewRecordDefaults | null;
} {
  const lastByUser = new Map<string, DailyRecordRow>();
  let last: DailyRecordRow | null = null;
  for (const row of rows) {
    const current = lastByUser.get(row.userId);
    if (!current || row.createdAt > current.createdAt) lastByUser.set(row.userId, row);
    if (!last || row.createdAt > last.createdAt) last = row;
  }
  return {
    byUser: Object.fromEntries(Array.from(lastByUser, ([userId, row]) => [userId, toDefaults(row)])),
    latest: last ? toDefaults(last) : null,
  };
}
