import { UserListItem } from "@/components/admin/users/UserListItem";
import { translate, type Locale, type TranslateFn } from "@/lib/i18n/translations";
import type { AdminUserRow } from "@/types/admin";

interface UserListProps {
  users: AdminUserRow[];
  locale: Locale;
}

export function UserList({ users, locale }: UserListProps) {
  const t: TranslateFn = (key, vars) => translate(locale, key, vars);

  return (
    <section aria-labelledby="users-heading" className="flex flex-col gap-3">
      <h2 id="users-heading" className="text-sm font-medium uppercase tracking-wide text-foreground/60">
        {t("adminUsers.usersHeading")}
      </h2>
      <ul className="flex flex-col gap-2">
        {users.map((user) => (
          <UserListItem key={user.id} user={user} locale={locale} />
        ))}
      </ul>
    </section>
  );
}
