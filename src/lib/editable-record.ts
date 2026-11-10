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
