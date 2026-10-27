import { logout } from "@/actions/auth";

export function SignOutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="text-sm text-foreground/60 underline hover:text-foreground">
        Sign out
      </button>
    </form>
  );
}
