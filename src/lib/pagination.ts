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

// Pages over the rows inside groups (e.g. records grouped by day) rather than the
// groups themselves: each page holds `pageSize` rows, in display order, and keeps
// the header of every group it touches. A group split across two pages appears on
// both with its rows divided; its other fields (e.g. a day total) stay whole.
export function paginateGroups<K extends string, G extends Record<K, unknown[]>>(
  groups: G[],
  key: K,
  page: number,
  pageSize: number,
): Page<G> {
  const rowCount = groups.reduce((sum, g) => sum + g[key].length, 0);
  const { page: current, pageCount } = paginate(new Array(rowCount), page, pageSize);
  const start = (current - 1) * pageSize;
  const end = start + pageSize;

  const items: G[] = [];
  let offset = 0;
  for (const group of groups) {
    const rows = group[key];
    const from = Math.max(start - offset, 0);
    const to = Math.min(end - offset, rows.length);
    if (from < to) items.push({ ...group, [key]: rows.slice(from, to) });
    offset += rows.length;
    if (offset >= end) break;
  }
  return { items, page: current, pageCount };
}
