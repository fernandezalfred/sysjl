// Every other day's rows get a soft background, so each day's records read as one
// block (Sale Records, Granos).
export function dayShadeClass(dayIndex: number): string {
  return dayIndex % 2 === 1 ? "bg-foreground/[0.06] dark:bg-foreground/[0.09]" : "";
}
