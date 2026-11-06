"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface PanelShellProps {
  isAdmin: boolean;
  userName: string | null | undefined;
  locale: Locale;
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
  if (pathname.startsWith("/admin/milk")) {
    return [
      { href: "/admin/milk", label: t("sidebar.administration") },
      { href: "/admin/milk", label: t("header.milk") },
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

export function PanelShell({ isAdmin, userName, locale, children }: PanelShellProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const groups: NavGroup[] = [
    {
      label: t("sidebar.overview"),
      items: [
        { href: "/dashboard", label: t("header.dashboard") },
        { href: "/account", label: t("header.account") },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: t("sidebar.administration"),
            items: [
              { href: "/admin/users", label: t("header.manageUsers") },
              { href: "/admin/milk", label: t("header.milk") },
              { href: "/admin/grains", label: t("header.grains") },
            ],
          },
        ]
      : []),
  ];
  const homeItem: NavItem = { href: "/", label: t("header.home") };
  const breadcrumbs = getBreadcrumbs(pathname, t);

  return (
    <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-8">
      <div className="sticky top-0 z-20 flex flex-col gap-3 border-b border-foreground/10 bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIsNavOpen(true)}
            aria-label={t("sidebar.openMenu")}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-foreground/15 text-sm text-foreground/70 hover:text-foreground"
          >
            ☰
          </button>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} />
            <span className="max-w-[7rem] truncate text-sm text-foreground/70">{userName}</span>
            <SignOutButton label={t("header.signOut")} />
          </div>
        </div>
        <Breadcrumbs items={breadcrumbs} label={t("sidebar.breadcrumbLabel")} />
      </div>

      {isNavOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label={t("sidebar.closeMenu")}
            onClick={() => setIsNavOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <nav className="relative z-50 flex h-full w-64 flex-col gap-1 overflow-y-auto bg-background p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-semibold">SysJL</span>
              <button
                type="button"
                onClick={() => setIsNavOpen(false)}
                aria-label={t("sidebar.closeMenu")}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground/60 hover:text-foreground"
              >
                ✕
              </button>
            </div>
            {groups.map((group) => (
              <NavGroupBlock
                key={group.label}
                group={group}
                pathname={pathname}
                onNavigate={() => setIsNavOpen(false)}
              />
            ))}
            <div className="mt-2 border-t border-foreground/10 pt-2">
              <PanelNavLink
                item={homeItem}
                isActive={isNavItemActive(pathname, homeItem.href)}
                onNavigate={() => setIsNavOpen(false)}
              />
            </div>
          </nav>
        </div>
      ) : null}

      <nav className="hidden w-56 flex-shrink-0 flex-col gap-1 border-r border-foreground/10 pr-4 lg:sticky lg:top-0 lg:flex lg:self-start lg:pt-3">
        <span className="mb-3 px-2 text-sm font-semibold">SysJL</span>
        {groups.map((group) => (
          <NavGroupBlock key={group.label} group={group} pathname={pathname} />
        ))}
        <div className="mt-4 border-t border-foreground/10 pt-2">
          <PanelNavLink item={homeItem} isActive={isNavItemActive(pathname, homeItem.href)} />
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <div className="sticky top-0 z-20 hidden flex-col gap-3 bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:flex">
          <div className="flex items-center justify-end gap-3">
            <LanguageSwitcher locale={locale} />
            <span className="max-w-[12rem] truncate text-sm text-foreground/70">{userName}</span>
            <SignOutButton label={t("header.signOut")} />
          </div>
          <Breadcrumbs items={breadcrumbs} label={t("sidebar.breadcrumbLabel")} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Breadcrumbs({ items, label }: { items: NavItem[]; label: string }) {
  return (
    <nav aria-label={label} className="flex items-center gap-1.5 text-sm">
      {items.map((crumb, index) => (
        <span key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span aria-hidden="true" className="text-foreground/30">
              /
            </span>
          ) : null}
          <span
            className={index === items.length - 1 ? "font-medium text-foreground" : "text-foreground/50"}
          >
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
    <div className="mb-3 flex flex-col gap-1">
      <p className="px-2 text-xs font-medium uppercase tracking-wide text-foreground/40">
        {group.label}
      </p>
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
      className={`rounded-md px-2 py-1.5 text-sm ${
        isActive
          ? "bg-foreground/10 font-medium text-foreground"
          : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
      }`}
    >
      {item.label}
    </Link>
  );
}
