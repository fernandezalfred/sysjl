import { auth } from "@/auth";

export class NotAuthorizedError extends Error {}

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new NotAuthorizedError("Admin access required.");
  }
  return session;
}
