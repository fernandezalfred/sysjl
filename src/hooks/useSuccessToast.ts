import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/ToastProvider";

// Shows `message` once each time a useActionState action returns a new success.
// Keyed on the state object itself, so a re-render with the same result (e.g. the
// parent passing a new onSaved callback) never shows it twice.
export function useSuccessToast(state: { success: boolean }, message: string) {
  const { showToast } = useToast();
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.success) showToast(message);
  }, [state, message, showToast]);
}
