import { Skeleton } from "@/components/ui/Skeleton";
import type { TranslateFn } from "@/lib/i18n/translations";

const COLUMN_KEYS = ["table.queso", "table.yogurt", "table.milkMote", "table.totalRevenue"] as const;

interface TableSkeletonProps {
  rows?: number;
  t: TranslateFn;
}

export function TableSkeleton({ rows = 2, t }: TableSkeletonProps) {
  const columns = COLUMN_KEYS.map((key) => t(key));

  return (
    <div className="overflow-hidden rounded-lg border border-foreground/10">
      <div className="rounded-md bg-foreground/10 px-3 py-1.5 dark:bg-foreground/15">
        <Skeleton className="h-3.5 w-24 bg-foreground/20" />
      </div>

      <table className="hidden w-full text-sm sm:table">
        <thead className="bg-foreground/[0.03] text-left text-foreground/60">
          <tr>
            <th className="px-4 py-2 font-medium">{t("table.user")}</th>
            {columns.map((c) => (
              <th key={c} className="px-4 py-2 font-medium">
                {c}
              </th>
            ))}
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-foreground/10">
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              {columns.map((c) => (
                <td key={c} className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </td>
              ))}
              <td className="px-4 py-3" />
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-foreground/10 sm:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex flex-col gap-3 p-4">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-2 gap-3">
              {columns.map((c) => (
                <div key={c} className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
