"use client";

import { useState } from "react";
import { paginate, paginateGroups } from "@/lib/pagination";

// Records shown per page in every paginated list.
export const RECORDS_PER_PAGE = 10;

// Client-side paging over an already-loaded list. The page is clamped on every
// render, so it stays valid when the list grows or shrinks after a save/delete.
export function usePagination<T>(items: T[], pageSize = RECORDS_PER_PAGE) {
  const [requestedPage, setPage] = useState(1);
  const { items: pageItems, page, pageCount } = paginate(items, requestedPage, pageSize);
  return { pageItems, page, pageCount, setPage };
}

// Same, but counts the rows inside groups (e.g. records grouped by day) — see paginateGroups.
export function useGroupedPagination<K extends string, G extends Record<K, unknown[]>>(
  groups: G[],
  key: K,
  pageSize = RECORDS_PER_PAGE,
) {
  const [requestedPage, setPage] = useState(1);
  const { items: pageItems, page, pageCount } = paginateGroups(groups, key, requestedPage, pageSize);
  return { pageItems, page, pageCount, setPage };
}
