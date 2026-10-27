import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
    vehicleId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      vehicleId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    vehicleId: string | null;
  }
}
