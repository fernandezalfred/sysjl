import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePageAccess } from "@/lib/auth/access";
import { getT } from "@/lib/i18n/server";
import { NotesSection } from "@/components/notes/NotesSection";
import { Skeleton } from "@/components/ui/Skeleton";
import type { NoteRow } from "@/lib/notes";

export default function NotesPage() {
  return (
    <Suspense fallback={<NotesSkeleton />}>
      <NotesContent />
    </Suspense>
  );
}

async function NotesContent() {
  await connection();
  const { companyId, userId } = await requirePageAccess();

  const [rows, { t, locale }] = await Promise.all([
    prisma.note.findMany({ where: { companyId, userId }, orderBy: { updatedAt: "desc" } }),
    getT(),
  ]);

  const notes: NoteRow[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    items: row.items.map((item) => ({ id: item.id, text: item.text, done: item.done })),
    color: row.color,
    pinned: row.pinned,
    updatedAt: row.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t("notes.heading")}</h1>
        <p className="text-sm text-foreground/70">{t("notes.subheading")}</p>
      </header>
      <NotesSection notes={notes} locale={locale} />
    </div>
  );
}

function NotesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-11 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
