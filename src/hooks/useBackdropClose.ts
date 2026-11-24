"use client";

import { useRef, type PointerEvent, type SyntheticEvent } from "react";
import { isAlertOpen } from "@/lib/alerts";
import { isOutsideRect } from "@/lib/dialog";

function isOnBackdrop(event: PointerEvent<HTMLDialogElement>): boolean {
  const dialog = event.currentTarget;
  return event.target === dialog && isOutsideRect(dialog.getBoundingClientRect(), event.clientX, event.clientY);
}

// Spread onto a modal <dialog> to close it when the user clicks outside it. The
// press must also start on the backdrop, so selecting text in an input and
// releasing the mouse outside the dialog doesn't close it. Esc while a popup is open
// (e.g. a delete confirmation) closes only the popup, not the modal under it.
export function useBackdropClose() {
  const pressedOnBackdrop = useRef(false);

  return {
    onPointerDown(event: PointerEvent<HTMLDialogElement>) {
      pressedOnBackdrop.current = isOnBackdrop(event);
    },
    onPointerUp(event: PointerEvent<HTMLDialogElement>) {
      if (pressedOnBackdrop.current && isOnBackdrop(event)) event.currentTarget.close();
      pressedOnBackdrop.current = false;
    },
    onCancel(event: SyntheticEvent<HTMLDialogElement>) {
      if (isAlertOpen()) event.preventDefault();
    },
  };
}
