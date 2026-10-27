import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-8">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
