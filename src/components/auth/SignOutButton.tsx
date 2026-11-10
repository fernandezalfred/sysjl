import type { ReactNode } from "react";
import { logout } from "@/actions/auth";

interface SignOutButtonProps {
  label?: string;
  // Replaces the default underlined-link look (e.g. an icon button in the panel sidebar).
  className?: string;
  // Content instead of the label (the label then stays as the accessible name).
  children?: ReactNode;
}

export function SignOutButton({
  label = "Sign out",
  className = "p-2 text-sm text-foreground/70 underline hover:text-foreground",
  children,
}: SignOutButtonProps) {
  return (
    <form action={logout}>
      <button type="submit" className={className} aria-label={children ? label : undefined} title={children ? label : undefined}>
        {children ?? label}
      </button>
    </form>
  );
}
