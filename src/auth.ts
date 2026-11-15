import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { toAccessClaims } from "@/lib/auth/permissions";
import { loadAccessClaims } from "@/lib/auth/claims";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (rawCredentials) => {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email }, include: { company: { select: { isActive: true } } } });
        const claims = user ? toAccessClaims(user) : null;
        if (!user || !claims) return null;

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email, ...claims };
      },
    }),
  ],
  callbacks: {
    // Runs on every session check: after sign-in the claims are re-read from the
    // database, and a user who can't sign in any more is signed out (null).
    async jwt({ token, user }) {
      const claims = user ? { role: user.role, companyId: user.companyId, permissions: user.permissions } : await loadAccessClaims(token.sub!);
      if (!claims) return null;
      return { ...token, ...claims };
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role;
      session.user.companyId = token.companyId;
      session.user.permissions = token.permissions;
      return session;
    },
  },
});
