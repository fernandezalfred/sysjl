import { describe, expect, it } from "vitest";
import { advancesBySeller, totalAdvances } from "@/lib/money/pay-advances";

const ANA = { userId: "u1", userName: "Ana" };
const BETO = { userId: "u2", userName: "Beto" };

describe("advancesBySeller", () => {
  it("lists every current seller, also those with no advances", () => {
    expect(advancesBySeller([BETO, ANA], [])).toEqual([
      { ...ANA, active: true, total: 0, advances: [] },
      { ...BETO, active: true, total: 0, advances: [] },
    ]);
  });

  it("totals each seller's advances, newest day first, biggest total first", () => {
    const result = advancesBySeller(
      [ANA, BETO],
      [
        { id: "a1", userId: "u1", userName: "Ana", date: "2026-11-01", amount: 50, description: "" },
        { id: "a2", userId: "u2", userName: "Beto", date: "2026-11-02", amount: 100, description: "x" },
        { id: "a3", userId: "u1", userName: "Ana", date: "2026-11-03", amount: 80, description: "" },
      ],
    );
    expect(result.map((s) => [s.userName, s.total])).toEqual([
      ["Ana", 130],
      ["Beto", 100],
    ]);
    expect(result[0].advances.map((a) => a.id)).toEqual(["a3", "a1"]);
    expect(totalAdvances(result)).toBe(230);
  });

  it("keeps a former seller who still has advances, marked inactive", () => {
    const [entry] = advancesBySeller([], [{ id: "a1", userId: "u9", userName: "Ex", date: "2026-11-01", amount: 20, description: "" }]);
    expect(entry).toMatchObject({ userId: "u9", userName: "Ex", active: false, total: 20 });
  });

});
