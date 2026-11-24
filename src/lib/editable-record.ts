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

// Each seller's most recently created record, as the starting values of their next one.
export function newRecordDefaultsByUser(rows: DailyRecordRow[]): Record<string, NewRecordDefaults> {
  const latest = new Map<string, DailyRecordRow>();
  for (const row of rows) {
    const current = latest.get(row.userId);
    if (!current || row.createdAt > current.createdAt) latest.set(row.userId, row);
  }
  return Object.fromEntries(
    Array.from(latest, ([userId, row]) => [
      userId,
      { quesoTaken: row.queso.taken, yogurtTaken: row.yogurt.taken, milkLiters: row.milkLiters, milkUnitCost: row.milkUnitCost },
    ]),
  );
}
