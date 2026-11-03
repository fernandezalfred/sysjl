import { describe, expect, it } from "vitest";
import { paginate, paginateGroups } from "@/lib/pagination";

const items = [1, 2, 3, 4, 5, 6, 7];

describe("paginate", () => {
  it("returns the items on the requested page", () => {
    expect(paginate(items, 1, 3)).toEqual({ items: [1, 2, 3], page: 1, pageCount: 3 });
    expect(paginate(items, 2, 3)).toEqual({ items: [4, 5, 6], page: 2, pageCount: 3 });
  });

  it("returns a shorter last page", () => {
    expect(paginate(items, 3, 3)).toEqual({ items: [7], page: 3, pageCount: 3 });
  });

  it("clamps a page past the end to the last page", () => {
    expect(paginate(items, 9, 3)).toEqual({ items: [7], page: 3, pageCount: 3 });
  });

  it("clamps a page below 1 to the first page", () => {
    expect(paginate(items, 0, 3).page).toBe(1);
    expect(paginate(items, -2, 3).page).toBe(1);
  });

  it("is a single page when everything fits", () => {
    expect(paginate(items, 1, 10)).toEqual({ items, page: 1, pageCount: 1 });
  });

  it("treats an empty list as one empty page", () => {
    expect(paginate([], 1, 5)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});

describe("paginateGroups", () => {
  const groups = [
    { date: "2026-11-03", total: 30, rows: ["a", "b", "c"] },
    { date: "2026-11-02", total: 20, rows: ["d", "e"] },
    { date: "2026-11-01", total: 10, rows: ["f"] },
  ];

  it("counts rows, not groups, and keeps each touched group's header", () => {
    expect(paginateGroups(groups, "rows", 1, 4)).toEqual({
      items: [
        { date: "2026-11-03", total: 30, rows: ["a", "b", "c"] },
        { date: "2026-11-02", total: 20, rows: ["d"] },
      ],
      page: 1,
      pageCount: 2,
    });
  });

  it("continues a split group on the next page with its other fields intact", () => {
    expect(paginateGroups(groups, "rows", 2, 4)).toEqual({
      items: [
        { date: "2026-11-02", total: 20, rows: ["e"] },
        { date: "2026-11-01", total: 10, rows: ["f"] },
      ],
      page: 2,
      pageCount: 2,
    });
  });

  it("clamps a page past the end and treats no groups as one empty page", () => {
    expect(paginateGroups(groups, "rows", 5, 4).page).toBe(2);
    expect(paginateGroups([], "rows", 1, 4)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});
