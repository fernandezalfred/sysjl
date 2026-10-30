import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { getT } from "@/lib/i18n/server";
import { DEFAULT_LOCALE, defaultT } from "@/lib/i18n/translations";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Suspense fallback={<LoginContentSkeleton />}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}

async function LoginContent() {
  const { t, locale } = await getT();

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">{t("login.title")}</h1>
      <LoginForm locale={locale} />
    </>
  );
}

function LoginContentSkeleton() {
  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">{defaultT("login.title")}</h1>
      <LoginForm locale={DEFAULT_LOCALE} />
    </>
  );
}
