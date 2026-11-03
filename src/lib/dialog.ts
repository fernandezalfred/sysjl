export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// True when (x, y) falls outside the dialog box — i.e. on its ::backdrop. Clicks on
// the backdrop are reported with the <dialog> itself as the target, so the target
// alone can't tell a backdrop click from a click on the dialog's own padding.
export function isOutsideRect(rect: Rect, x: number, y: number): boolean {
  return x < rect.left || x > rect.right || y < rect.top || y > rect.bottom;
}
