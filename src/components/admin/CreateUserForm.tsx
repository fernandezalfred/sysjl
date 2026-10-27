"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createUser, type ActionState } from "@/actions/admin-users";

const initialState: ActionState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create user"}
    </button>
  );
}

export function CreateUserForm() {
  const [state, formAction] = useActionState(createUser, initialState);

  return (
    <details className="rounded-lg border border-foreground/10 p-4">
      <summary className="cursor-pointer text-sm font-medium">Create new user</summary>
      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="new-name" className="text-xs font-medium text-foreground/60">
              Name
            </label>
            <input
              id="new-name"
              name="name"
              required
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-email" className="text-xs font-medium text-foreground/60">
              Email
            </label>
            <input
              id="new-email"
              name="email"
              type="email"
              required
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-password" className="text-xs font-medium text-foreground/60">
              Password
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="new-role" className="text-xs font-medium text-foreground/60">
              Role
            </label>
            <select
              id="new-role"
              name="role"
              defaultValue="VEHICLE_USER"
              className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm"
            >
              <option value="VEHICLE_USER">Vehicle user</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}
        {state.success ? <p className="text-sm text-green-600 dark:text-green-400">User created.</p> : null}

        <div>
          <SubmitButton />
        </div>
      </form>
    </details>
  );
}
