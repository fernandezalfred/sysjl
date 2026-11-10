"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { NavIcon, type NavIconName } from "@/components/layout/NavIcon";
import { SellerPayBar, type SellerPayTotals } from "@/components/layout/SellerPayBar";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";

interface NavItem {
  href: string;
  label: string;
  icon?: NavIconName;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface PanelShellProps {
  isAdmin: boolean;
  userName: string | null | undefined;
  locale: Locale;
  // A seller's pay totals, shown instead of the breadcrumbs; null for admins.
  payTotals: SellerPayTotals | null;
  children: ReactNode;
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getBreadcrumbs(pathname: string, t: TranslateFn): NavItem[] {
  if (pathname.startsWith("/account")) {
    return [
      { href: "/account", label: t("sidebar.overview") },
      { href: "/account", label: t("header.account") },
    ];
  }
  if (pathname.startsWith("/admin/users")) {
    return [
      { href: "/admin/users", label: t("sidebar.administration") },
      { href: "/admin/users", label: t("header.manageUsers") },
    ];
  }
  if (pathname.startsWith("/admin/grains")) {
    return [
      { href: "/admin/grains", label: t("sidebar.administration") },
      { href: "/admin/grains", label: t("header.grains") },
    ];
  }
  return [
    { href: "/dashboard", label: t("sidebar.overview") },
    { href: "/dashboard", label: t("header.dashboard") },
  ];
}

// "Raul Mamani" -> "RM", "Raul" -> "RA".
function initialsOf(name: string | null | undefined): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function PanelShell({ isAdmin, userName, locale, payTotals, children }: PanelShellProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const groups: NavGroup[] = [
    {
      label: t("sidebar.overview"),
      items: [
        { href: "/dashboard", label: t("header.dashboard"), icon: "dashboard" },
        { href: "/account", label: t("header.account"), icon: "account" },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: t("sidebar.administration"),
            items: [
              { href: "/admin/users", label: t("header.manageUsers"), icon: "users" as const },
              { href: "/admin/grains", label: t("header.grains"), icon: "grains" as const },
            ],
          },
        ]
      : []),
  ];
  const homeItem: NavItem = { href: "/", label: t("header.home"), icon: "home" };
  const breadcrumbs = getBreadcrumbs(pathname, t);
  const greeting = t("sidebar.greeting", { name: (userName ?? "").trim().split(/\s+/)[0] ?? "" });
  const user: UserInfo = {
    name: userName ?? "",
    initials: initialsOf(userName),
    role: isAdmin ? t("adminUsers.roleAdmin") : t("adminUsers.roleVehicleUser"),
  };

  const sidebar = (onNavigate?: () => void) => (
    <SidebarContent
      groups={groups}
      homeItem={homeItem}
      pathname={pathname}
      user={user}
      locale={locale}
      onNavigate={onNavigate}
      t={t}
    />
  );

  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
      {/* Phone / tablet bar. */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 border-b border-foreground/10 bg-background/90 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:-mx-6 sm:px-6 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsNavOpen(true)}
              aria-label={t("sidebar.openMenu")}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-foreground/15 text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true" className="h-5 w-5">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="min-w-0">
              {payTotals ? null : <Breadcrumbs items={breadcrumbs} label={t("sidebar.breadcrumbLabel")} />}
              <p className="truncate text-base font-semibold tracking-tight">{greeting}</p>
            </div>
          </div>
          <Avatar initials={user.initials} name={user.name} />
        </div>
        {payTotals ? <SellerPayBar totals={payTotals} t={t} /> : null}
      </div>

      {isNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t("sidebar.closeMenu")}
            onClick={() => setIsNavOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <nav className="relative z-50 flex h-full w-72 max-w-[85vw] flex-col bg-background p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsNavOpen(false)}
              aria-label={t("sidebar.closeMenu")}
              className="absolute top-4 right-3 flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
            >
              ✕
            </button>
            {sidebar(() => setIsNavOpen(false))}
          </nav>
        </div>
      ) : null}

      {/* Desktop sidebar: a card pinned to the viewport height while the page scrolls. */}
      <nav className="hidden w-64 flex-shrink-0 lg:sticky lg:top-8 lg:flex lg:h-[calc(100dvh-4rem)] lg:self-start">
        <div className="flex w-full flex-col rounded-2xl border border-foreground/10 bg-foreground/[0.025] p-4 shadow-sm">
          {sidebar()}
        </div>
      </nav>

      {/* --sticky-offset: height of the pinned header bar below (lg+), so pinned table
          headers inside the page sit just under it instead of behind it. */}
      <div className="flex min-w-0 flex-1 flex-col gap-8 lg:[--sticky-offset:5rem]">
        <header className="sticky top-0 z-20 hidden h-20 items-center justify-between gap-6 border-b border-foreground/10 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 lg:flex">
          <div className="min-w-0">
            {payTotals ? null : <Breadcrumbs items={breadcrumbs} label={t("sidebar.breadcrumbLabel")} />}
            <p className="truncate text-xl font-semibold tracking-tight">{greeting}</p>
          </div>
          {payTotals ? <SellerPayBar totals={payTotals} t={t} /> : null}
        </header>
        {children}
      </div>
    </div>
  );
}

interface UserInfo {
  name: string;
  initials: string;
  role: string;
}

function SidebarContent({
  groups,
  homeItem,
  pathname,
  user,
  locale,
  onNavigate,
  t,
}: {
  groups: NavGroup[];
  homeItem: NavItem;
  pathname: string;
  user: UserInfo;
  locale: Locale;
  onNavigate?: () => void;
  t: TranslateFn;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Link href="/dashboard" onClick={onNavigate} className="mb-6 flex items-center gap-3 px-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-md shadow-sky-600/20">
          JL
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight">SysJL</span>
          <span className="text-xs text-foreground/60">{t("sidebar.tagline")}</span>
        </span>
      </Link>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {groups.map((group) => (
          <NavGroupBlock key={group.label} group={group} pathname={pathname} onNavigate={onNavigate} />
        ))}
        <div className="border-t border-foreground/10 pt-4">
          <PanelNavLink item={homeItem} isActive={isNavItemActive(pathname, homeItem.href)} onNavigate={onNavigate} />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-foreground/10 pt-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium uppercase tracking-wider text-foreground/50">{t("sidebar.language")}</span>
          <LanguageSwitcher locale={locale} />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-foreground/10 bg-background p-2.5">
          <Avatar initials={user.initials} name={user.name} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-foreground/60">{user.role}</p>
          </div>
          <SignOutButton
            label={t("header.signOut")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
          >
            <NavIcon name="signOut" className="h-[18px] w-[18px]" />
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}

function Avatar({ initials, name }: { initials: string; name: string }) {
  return (
    <span
      title={name}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sky-600/15 text-xs font-semibold text-sky-700 ring-1 ring-sky-600/25 dark:text-sky-300"
    >
      {initials}
    </span>
  );
}

function Breadcrumbs({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <nav aria-label={label} className="flex items-center gap-1.5 text-xs">
      {items.map((crumb, index) => (
        <span key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="text-foreground/30">
              ›
            </span>
          ) : null}
          <span className={index === items.length - 1 ? "font-medium text-sky-700 dark:text-sky-300" : "text-foreground/55"}>
            {crumb.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

function NavGroupBlock({
  group,
  pathname,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-foreground/45">{group.label}</p>
      {group.items.map((item) => (
        <PanelNavLink
          key={item.href}
          item={item}
          isActive={isNavItemActive(pathname, item.href)}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function PanelNavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-sky-600/10 font-medium text-sky-700 dark:bg-sky-400/10 dark:text-sky-300"
          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      {isActive ? (
        <span aria-hidden="true" className="absolute top-1.5 bottom-1.5 left-0 w-1 rounded-r-full bg-sky-600 dark:bg-sky-400" />
      ) : null}
      {item.icon ? (
        <NavIcon
          name={item.icon}
          className={`h-[18px] w-[18px] ${isActive ? "" : "text-foreground/50 group-hover:text-foreground/80"}`}
        />
      ) : null}
      {item.label}
    </Link>
  );
}
