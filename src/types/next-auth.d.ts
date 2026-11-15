import type { AdminPermission, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    companyId: string | null;
    permissions: AdminPermission[];
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      companyId: string | null;
      permissions: AdminPermission[];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    companyId: string | null;
    permissions: AdminPermission[];
  }
}
