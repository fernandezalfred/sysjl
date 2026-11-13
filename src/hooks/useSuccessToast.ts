import { useEffect, useRef } from "react";
import { successToast } from "@/lib/alerts";

// Shows `message` once each time a useActionState action returns a new success.
// Keyed on the state object itself, so a re-render with the same result (e.g. the
// parent passing a new onSaved callback) never shows it twice.
export function useSuccessToast(state: { success: boolean }, message: string) {
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.success) successToast(message);
  }, [state, message]);
}
