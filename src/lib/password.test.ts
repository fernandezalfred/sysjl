import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("hashPassword / verifyPassword", () => {
  it("verifies a password against its own hash", async () => {
    const hash = await hashPassword("ChangeMe123!");
    await expect(verifyPassword("ChangeMe123!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("ChangeMe123!");
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time (salted)", async () => {
    const [a, b] = await Promise.all([hashPassword("same-input"), hashPassword("same-input")]);
    expect(a).not.toBe(b);
  });

  it("never returns the plaintext password as the hash", async () => {
    const hash = await hashPassword("ChangeMe123!");
    expect(hash).not.toBe("ChangeMe123!");
  });
});
