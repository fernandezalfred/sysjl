import { prisma } from "@/lib/prisma";
import { toAccessClaims, type AccessClaims } from "@/lib/auth/permissions";

// A user's current claims from the database (null = can't be signed in any more), so
// a permission change, a deactivation or a deactivated company applies on the next
// request instead of when the JWT expires.
export async function loadAccessClaims(userId: string): Promise<AccessClaims | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, companyId: true, permissions: true, isActive: true, company: { select: { isActive: true } } },
  });
  return user ? toAccessClaims(user) : null;
}
