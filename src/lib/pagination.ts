export interface Page<T> {
  items: T[];
  // 1-based, clamped to [1, pageCount].
  page: number;
  // Always at least 1, so an empty list is one empty page.
  pageCount: number;
}

// The slice of `items` on `page` (1-based). An out-of-range page is clamped, so a
// list that shrinks (e.g. after a delete) never leaves the viewer on an empty page.
export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, Math.floor(page)), pageCount);
  const start = (current - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page: current, pageCount };
}

// Pages over groups (e.g. records grouped by day) by their row count, never
// splitting a group: a page takes whole groups until it holds at least
// `pageSize` rows, so the group that reaches the limit stays complete on that
// page (the page rounds up) and the next group starts the next page. A single
// group bigger than `pageSize` is one page on its own.
export function paginateGroups<K extends string, G extends Record<K, unknown[]>>(
  groups: G[],
  key: K,
  page: number,
  pageSize: number,
): Page<G> {
  const pages: G[][] = [[]];
  let rowsOnPage = 0;
  for (const group of groups) {
    if (rowsOnPage >= pageSize) {
      pages.push([]);
      rowsOnPage = 0;
    }
    pages[pages.length - 1].push(group);
    rowsOnPage += group[key].length;
  }

  const { items, page: current, pageCount } = paginate(pages, page, 1);
  return { items: items[0], page: current, pageCount };
}
