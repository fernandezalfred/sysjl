import { describe, expect, it } from "vitest";
import { buildDailyRecords } from "@/lib/daily-records";
import { buildFinanceByPeriod, buildSellerFinance, grainsTotalByDay } from "@/lib/money/finance";
import { buildGrainsShareByDate } from "@/lib/money/revenue";
import { translate } from "@/lib/i18n/translations";
import { buildFinanceReport, toCsv } from "@/lib/reports";
import type { SaleRecord } from "@/types/daily-records";

const t = (key: string, vars?: Record<string, string | number>) => translate("es", key, vars);

const record = (overrides: Partial<SaleRecord>): SaleRecord => ({
  id: "q",
  workRecordId: "wr1",
  payPaid: false,
  totalSold: 2700,
  createdAt: "2026-11-09T20:00:00.000Z",
  date: "2026-11-09",
  userId: "u1",
  userName: "Raul",
  product: "QUESO",
  unitPrice: 9,
  quantityTaken: 150,
  quantityRemaining: 33,
  milkLiters: 30,
  milkUnitCost: 7,
  ...overrides,
});

const rows = buildDailyRecords([
  record({}),
  record({ id: "y", product: "YOGURT", unitPrice: 33, quantityTaken: 30, quantityRemaining: 13 }),
]);
const unitCosts = { QUESO: 6, YOGURT: 22 };
const grains = { "2026-11-09": { MAIZ_PELADO: 100.3, MAIZ_CASCARA: 20, HABA: 8 } };
const periods = buildFinanceByPeriod(rows, unitCosts, grains, "day");
const sellers = buildSellerFinance(
  rows,
  unitCosts,
  { grainsShareByDate: buildGrainsShareByDate(grainsTotalByDay(grains), rows) },
  "day",
  "2026-11-09",
);
const tables = buildFinanceReport({ label: "9 nov", figures: periods[0] }, periods, () => "9 nov", sellers, t);

describe("buildFinanceReport", () => {
  it("builds the summary, by-period and by-seller tables with whole bolivianos", () => {
    expect(tables.map((table) => table.title)).toEqual(["Resumen", "Por periodo", "Por vendedor"]);

    const summary = Object.fromEntries(tables[0].rows.map(([concept, amount]) => [concept, amount]));
    expect(summary["Total vendido (todos los productos)"]).toBe(2700);
    expect(tables[0].rows.find(([concept]) => concept === "Queso")).toEqual(["Queso", 1053, "Sacó 150 · Vendió 117 · Sobró 33"]);
    expect(summary["Maíz Pelado"]).toBe(100);
    expect(summary["Haba"]).toBe(8);
    expect(summary["Costos"]).toBe(1414);
    expect(summary["Neto"]).toBe(1286);
    expect(summary["Resultado"]).toBe(1116);

    expect(tables[1].rows).toEqual([["9 nov", 1053, 561, 1086, 2700, 1414, 1286, 170, 1116]]);
    expect(tables[2].rows).toEqual([["Raul", 1, 2700, 1286, 170, 1116]]);
  });
});

describe("buildFinanceReport since the beginning", () => {
  it("names the costs the total investment and the result the accumulated net profit", () => {
    const [summary, running] = buildFinanceReport({ label: "9 nov – 9 nov", figures: periods[0] }, periods, () => "noviembre", sellers, t, true);
    const amounts = Object.fromEntries(summary.rows.map(([concept, amount]) => [concept, amount]));

    expect(amounts["Inversión total"]).toBe(1414);
    expect(amounts["Ganancia neta acumulada"]).toBe(1116);
    expect(running.title).toBe("Acumulado mes a mes");
    expect(running.header).toContain("Ganancia neta acumulada");
  });
});

describe("toCsv", () => {
  it("writes each table with its title, quoting cells that need it, behind a BOM", () => {
    const csv = toCsv([{ title: "Ventas", header: ["Vendedor", "Total"], rows: [['Raul "R", Jr', 1200]] }]);

    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1).split("\r\n")).toEqual(["Ventas", "Vendedor,Total", '"Raul ""R"", Jr",1200', ""]);
  });
});
