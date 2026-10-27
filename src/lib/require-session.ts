import { auth } from "@/auth";
import { NotAuthorizedError } from "@/lib/require-admin";

export async function requireUserSession() {
  const session = await auth();
  if (!session?.user) {
    throw new NotAuthorizedError("Sign-in required.");
  }
  return session;
}
