import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, hashPasswordMock, verifyPasswordMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  hashPasswordMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/password", () => ({
  hashPassword: hashPasswordMock,
  verifyPassword: verifyPasswordMock,
}));

import { changeOwnPassword } from "@/actions/account";

const SESSION = { user: { id: "user-1", role: "VEHICLE_USER" } };
const ACTIVE_USER = { id: "user-1", isActive: true, passwordHash: "hashed:oldpassword" };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const VALID_FIELDS = {
  currentPassword: "oldpassword",
  newPassword: "newpassword",
  confirmPassword: "newpassword",
};

beforeEach(() => {
  vi.clearAllMocks();
  hashPasswordMock.mockImplementation(async (pw: string) => `hashed:${pw}`);
  verifyPasswordMock.mockImplementation(async (pw: string, hash: string) => hash === `hashed:${pw}`);
});

describe("changeOwnPassword", () => {
  it("rejects a guest without touching the database", async () => {
    authMock.mockResolvedValue(null);
    const result = await changeOwnPassword({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Sign-in required." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a short new password", async () => {
    authMock.mockResolvedValue(SESSION);
    const result = await changeOwnPassword(
      { success: false },
      formData({ ...VALID_FIELDS, newPassword: "short", confirmPassword: "short" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects a confirmation that doesn't match", async () => {
    authMock.mockResolvedValue(SESSION);
    const result = await changeOwnPassword(
      { success: false },
      formData({ ...VALID_FIELDS, confirmPassword: "otherpassword" }),
    );
    expect(result).toEqual({ success: false, error: "The new passwords don't match." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects a new password equal to the current one", async () => {
    authMock.mockResolvedValue(SESSION);
    const result = await changeOwnPassword(
      { success: false },
      formData({ currentPassword: "samepassword", newPassword: "samepassword", confirmPassword: "samepassword" }),
    );
    expect(result).toEqual({
      success: false,
      error: "The new password must be different from the current one.",
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects a deactivated user", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ ...ACTIVE_USER, isActive: false });
    const result = await changeOwnPassword({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects a wrong current password", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.user.findUnique.mockResolvedValue(ACTIVE_USER);
    const result = await changeOwnPassword(
      { success: false },
      formData({ ...VALID_FIELDS, currentPassword: "wrongpassword" }),
    );
    expect(result).toEqual({ success: false, error: "Current password is incorrect." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("updates the signed-in user's password, ignoring any submitted user id", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.user.findUnique.mockResolvedValue(ACTIVE_USER);
    const result = await changeOwnPassword(
      { success: false },
      formData({ ...VALID_FIELDS, userId: "someone-else" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "hashed:newpassword" },
    });
  });
});
