import { startTransition, type FormEvent } from "react";

// Submits a form to a useActionState action without React's automatic form reset.
// With `<form action={…}>`, React clears every uncontrolled field once the action
// finishes, even when it returns a validation error, so the user loses what they
// typed. Submitting from onSubmit inside a transition never auto-resets; forms that
// should clear after a success do it themselves. Pending state comes from
// useActionState's third value (useFormStatus only tracks `action` submissions).
export function useSubmitWithoutReset(dispatch: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
