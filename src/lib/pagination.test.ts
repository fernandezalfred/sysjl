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

  it("never splits a group: the group that reaches the limit stays whole on the page", () => {
    expect(paginateGroups(groups, "rows", 1, 4)).toEqual({
      items: [
        { date: "2026-11-03", total: 30, rows: ["a", "b", "c"] },
        { date: "2026-11-02", total: 20, rows: ["d", "e"] },
      ],
      page: 1,
      pageCount: 2,
    });
    expect(paginateGroups(groups, "rows", 2, 4)).toEqual({
      items: [{ date: "2026-11-01", total: 10, rows: ["f"] }],
      page: 2,
      pageCount: 2,
    });
  });

  it("starts a new page once a page is exactly full", () => {
    expect(paginateGroups(groups, "rows", 1, 3).items.map((g) => g.date)).toEqual(["2026-11-03"]);
    expect(paginateGroups(groups, "rows", 2, 3).items.map((g) => g.date)).toEqual(["2026-11-02", "2026-11-01"]);
  });

  it("keeps a group bigger than the page size whole on its own page", () => {
    const result = paginateGroups(groups, "rows", 1, 2);
    expect(result.items).toEqual([groups[0]]);
    expect(result.pageCount).toBe(3);
  });

  it("clamps a page past the end and treats no groups as one empty page", () => {
    expect(paginateGroups(groups, "rows", 5, 4).page).toBe(2);
    expect(paginateGroups([], "rows", 1, 4)).toEqual({ items: [], page: 1, pageCount: 1 });
  });
});
