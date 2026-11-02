import { describe, expect, it } from "vitest";
import { aggregateByPeriod, formatPeriodLabel } from "@/lib/date-buckets";

describe("aggregateByPeriod", () => {
  it("sums same-day values into one day bucket", () => {
    const result = aggregateByPeriod(
      [
        { date: "2026-10-30", value: 100 },
        { date: "2026-10-30", value: 50 },
        { date: "2026-10-29", value: 20 },
      ],
      "day",
    );

    expect(result).toEqual([
      { period: "2026-10-29", total: 20 },
      { period: "2026-10-30", total: 150 },
    ]);
  });

  it("buckets by the Monday of each date's week", () => {
    // 2026-10-27 is a Tuesday, 2026-10-30 a Friday — same ISO week (Monday 2026-10-26).
    // 2026-11-02 is the following Monday — a new week bucket.
    const result = aggregateByPeriod(
      [
        { date: "2026-10-27", value: 10 },
        { date: "2026-10-30", value: 5 },
        { date: "2026-11-02", value: 7 },
      ],
      "week",
    );

    expect(result).toEqual([
      { period: "2026-10-26", total: 15 },
      { period: "2026-11-02", total: 7 },
    ]);
  });

  it("buckets a Sunday into the week that started the previous Monday", () => {
    // 2026-11-01 is a Sunday, the last day of the week starting 2026-10-26.
    const result = aggregateByPeriod([{ date: "2026-11-01", value: 9 }], "week");

    expect(result).toEqual([{ period: "2026-10-26", total: 9 }]);
  });

  it("buckets by calendar month", () => {
    const result = aggregateByPeriod(
      [
        { date: "2026-10-05", value: 10 },
        { date: "2026-10-28", value: 20 },
        { date: "2026-11-01", value: 30 },
      ],
      "month",
    );

    expect(result).toEqual([
      { period: "2026-10", total: 30 },
      { period: "2026-11", total: 30 },
    ]);
  });

  it("returns an empty array for no items", () => {
    expect(aggregateByPeriod([], "day")).toEqual([]);
  });
});

describe("formatPeriodLabel", () => {
  it("formats a day period as a short date", () => {
    expect(formatPeriodLabel("2026-10-30", "day")).toBe("Oct 30");
  });

  it("formats a week period (its Monday) as a short date", () => {
    expect(formatPeriodLabel("2026-10-26", "week")).toBe("Oct 26");
  });

  it("formats a month period as month and year", () => {
    expect(formatPeriodLabel("2026-10", "month")).toBe("Oct 2026");
  });
});
