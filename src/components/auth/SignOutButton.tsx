import { logout } from "@/actions/auth";

interface SignOutButtonProps {
  label?: string;
}

export function SignOutButton({ label = "Sign out" }: SignOutButtonProps) {
  return (
    <form action={logout}>
      <button type="submit" className="p-2 text-sm text-foreground/60 underline hover:text-foreground">
        {label}
      </button>
    </form>
  );
}
