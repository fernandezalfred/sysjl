"use client";

import { useState } from "react";
import { UserListItem } from "@/components/admin/users/UserListItem";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { filterUsers } from "@/lib/user-search";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { AdminUserRow } from "@/types/admin";

interface UserListProps {
  users: AdminUserRow[];
  canManageAdmins: boolean;
  locale: Locale;
}

const USERS_PER_PAGE = 20;

// Any number of users: a search box (name or email) and pages of 20.
export function UserList({ users, canManageAdmins, locale }: UserListProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);
  const [query, setQuery] = useState("");
  const matches = filterUsers(users, query);
  const pager = usePagination(matches, USERS_PER_PAGE);

  return (
    <section aria-labelledby="users-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="users-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/70">
          {t("adminUsers.usersHeading")} <span className="tabular-nums text-foreground/50">({users.length})</span>
        </h2>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            pager.setPage(1);
          }}
          placeholder={t("adminUsers.search")}
          aria-label={t("adminUsers.search")}
          className="w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-base sm:w-72"
        />
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-foreground/70">{t("adminUsers.noMatches")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {pager.pageItems.map((user) => (
            <UserListItem key={user.id} user={user} canManageAdmins={canManageAdmins} locale={locale} />
          ))}
        </ul>
      )}
      <Pagination page={pager.page} pageCount={pager.pageCount} setPage={pager.setPage} t={t} />
    </section>
  );
}
