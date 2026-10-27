import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MyRecordsSection } from "@/components/records/MyRecordsSection";

export default function RecordsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={<RecordsSkeleton />}>
        <RecordsContent />
      </Suspense>
    </div>
  );
}

async function RecordsContent() {
  await connection();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return <p className="text-sm text-foreground/60">Sign in to view your records.</p>;
  }

  const records = await prisma.dailyWorkRecord.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">My Daily Records</h1>
        <p className="text-sm text-foreground/60">
          Record quantities taken from the deposit and remaining at the end of each working day.
        </p>
      </header>

      <MyRecordsSection
        records={records.map((r) => ({
          id: r.id,
          date: r.date.toISOString().slice(0, 10),
          quesoTaken: r.quesoTaken,
          quesoRemaining: r.quesoRemaining,
          yogurtTaken: r.yogurtTaken,
          yogurtRemaining: r.yogurtRemaining,
        }))}
      />
    </div>
  );
}

function RecordsSkeleton() {
  return <div className="animate-pulse text-sm text-foreground/50">Loading records…</div>;
}
