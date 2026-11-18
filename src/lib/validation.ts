import { z } from "zod";

// Shared input rules for Server Actions. Prisma-free, so any module can use it.

// A MongoDB ObjectId as Prisma stores it. Checked before every lookup by id: Prisma
// throws on a malformed id, and a Server Action's arguments come straight from the
// browser.
export const OBJECT_ID = /^[0-9a-f]{24}$/i;

export function objectIdSchema(message: string) {
  return z.string().regex(OBJECT_ID, message);
}

// A calendar day as YYYY-MM-DD that exists (e.g. not 2026-02-30).
export const DATE_KEY = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required.")
  .refine((key) => {
    const date = new Date(`${key}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(key);
  }, "Date is required.");

// bcrypt only reads the first 72 bytes of a password; longer ones are refused instead
// of being cut silently.
export const NEW_PASSWORD = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .refine((password) => new TextEncoder().encode(password).length <= 72, "Password must be at most 72 characters.");

export const PERSON_NAME = z.string().trim().min(1, "Name is required.").max(100, "Name is too long.");

export const EMAIL = z.string().trim().max(254, "Enter a valid email address.").email("Enter a valid email address.");

// The first validation message, for the form to show inline.
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}
