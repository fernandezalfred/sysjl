"use client";

import { useRef, type FormEvent } from "react";
import { warningAlert } from "@/lib/alerts";
import type { TranslateFn } from "@/lib/i18n/translations";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// A field's name as the user sees it: its label, after its group's title when it has
// one (e.g. "Yogurt – Sacó").
function fieldName(field: Field): string {
  const label = field.labels?.[0]?.textContent?.trim() || field.name;
  const group = field.closest("fieldset")?.querySelector("legend")?.textContent?.trim();
  return group ? `${group} – ${label}` : label;
}

// For a form's onInvalid (React passes each field's "invalid" up to the form): when a submit is blocked because fields are empty or
// invalid, shows one popup naming them (instead of the browser's bubble, easy to miss
// on a phone), marks every field with data-checked so the invalid ones turn red, and
// then focuses the first one.
export function useInvalidFormAlert(t: TranslateFn) {
  const scheduled = useRef(false);

  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    // The browser fires "invalid" once per field; gather them all into one popup.
    if (scheduled.current) return;
    scheduled.current = true;

    setTimeout(async () => {
      scheduled.current = false;
      const fields = [...form.elements].filter(
        (el): el is Field => el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement,
      );
      fields.forEach((field) => (field.dataset.checked = "true"));
      const invalid = fields.filter((field) => !field.validity.valid);
      if (invalid.length === 0) return;

      await warningAlert(t, t("alert.incompleteTitle"), t("alert.incompleteText", { fields: invalid.map(fieldName).join(", ") }));
      invalid[0].focus();
      invalid[0].scrollIntoView({ block: "center", behavior: "smooth" });
    }, 0);
  };
}
