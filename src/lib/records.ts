import type { DailyRecordRow } from "@/types/landing";
import type { DailyWorkRecordRow } from "@/types/records";

export function toEditableRecord(row: DailyRecordRow): DailyWorkRecordRow {
  return {
    id: row.workRecordId,
    date: row.date,
    quesoTaken: row.queso.taken,
    quesoRemaining: row.queso.remaining,
    yogurtTaken: row.yogurt.taken,
    yogurtRemaining: row.yogurt.remaining,
    totalSold: row.totalSold,
  };
}
