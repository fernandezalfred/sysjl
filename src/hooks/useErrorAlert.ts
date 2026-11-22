import { useEffect, useRef } from "react";
import { errorAlert } from "@/lib/alerts";
import { localizeError } from "@/lib/i18n/errors";
import type { TranslateFn } from "@/lib/i18n/translations";

// Shows a useActionState action's error in a popup once each time it returns a new
// one (the form also keeps it inline). Keyed on the state object, like useSuccessToast.
export function useErrorAlert(state: { error?: string }, t: TranslateFn) {
  const lastState = useRef(state);

  useEffect(() => {
    if (state === lastState.current) return;
    lastState.current = state;
    if (state.error) errorAlert(t, localizeError(t, state.error));
  }, [state, t]);
}
