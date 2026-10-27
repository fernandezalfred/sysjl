import { beforeEach, describe, expect, it, vi } from "vitest";

// next-auth's real package pulls in next/server, which isn't resolvable
// outside the Next.js build pipeline — mock both it and our auth.ts config
// so this test stays a plain Node unit test per coding-standards.md.
const { signIn, signOut, AuthError } = vi.hoisted(() => {
  class AuthError extends Error {}
  return { signIn: vi.fn(), signOut: vi.fn(), AuthError };
});

vi.mock("@/auth", () => ({ signIn, signOut }));
vi.mock("next-auth", () => ({ AuthError }));

import { login, logout } from "@/actions/auth";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("login", () => {
  beforeEach(() => {
    signIn.mockReset();
  });

  it("returns a validation error for an invalid email without calling signIn", async () => {
    const result = await login({ success: false }, formData({ email: "not-an-email", password: "x" }));
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("returns a validation error for an empty password without calling signIn", async () => {
    const result = await login({ success: false }, formData({ email: "a@b.com", password: "" }));
    expect(result.success).toBe(false);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("returns a generic invalid-credentials error when signIn throws an AuthError", async () => {
    signIn.mockRejectedValueOnce(new AuthError("Credentials sign in failed"));
    const result = await login({ success: false }, formData({ email: "a@b.com", password: "wrong" }));
    expect(result).toEqual({ success: false, error: "Invalid email or password." });
  });

  it("re-throws non-AuthError errors (e.g. the redirect signal on success) instead of swallowing them", async () => {
    const redirectError = new Error("NEXT_REDIRECT");
    signIn.mockRejectedValueOnce(redirectError);
    await expect(
      login({ success: false }, formData({ email: "a@b.com", password: "correct" })),
    ).rejects.toBe(redirectError);
  });

  it("calls signIn with the parsed credentials and a redirect target", async () => {
    signIn.mockRejectedValueOnce(new Error("NEXT_REDIRECT"));
    await login({ success: false }, formData({ email: "a@b.com", password: "correct" })).catch(() => {});
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "a@b.com",
      password: "correct",
      redirectTo: "/",
    });
  });
});

describe("logout", () => {
  it("calls signOut with a redirect to /login", async () => {
    signOut.mockResolvedValueOnce(undefined);
    await logout();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});
