import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Locale, TranslateFn } from "@/lib/i18n/translations";

interface AppHeaderProps {
  title: string;
  generatedAt: string;
  userName: string | null | undefined;
  isAdmin: boolean;
  isSignedIn: boolean;
  activePage: "home" | "dashboard";
  locale: Locale;
  t: TranslateFn;
}

export function AppHeader({
  title,
  generatedAt,
  userName,
  isAdmin,
  isSignedIn,
  activePage,
  locale,
  t,
}: AppHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-foreground/60">
          {t("header.updated")}{" "}
          {new Date(generatedAt).toLocaleString("es-BO", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher locale={locale} />
        {isSignedIn ? (
          <>
            {activePage === "dashboard" ? (
              <Link href="/" className="text-sm text-foreground/60 underline hover:text-foreground">
                {t("header.home")}
              </Link>
            ) : (
              <Link href="/dashboard" className="text-sm text-foreground/60 underline hover:text-foreground">
                {t("header.dashboard")}
              </Link>
            )}
            <span className="text-sm text-foreground/70">{userName}</span>
            {isAdmin ? (
              <>
                <Link href="/admin/users" className="text-sm text-foreground/60 underline hover:text-foreground">
                  {t("header.manageUsers")}
                </Link>
                <Link href="/admin/products" className="text-sm text-foreground/60 underline hover:text-foreground">
                  {t("header.productPrices")}
                </Link>
              </>
            ) : null}
            <SignOutButton label={t("header.signOut")} />
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background"
          >
            {t("header.signIn")}
          </Link>
        )}
      </div>
    </header>
  );
}

export function AppHeaderSkeleton() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-36" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </header>
  );
}
