import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, hashPasswordMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  hashPasswordMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: hashPasswordMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { createUser, updateUser, setUserActive } from "@/actions/admin-users";

const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN" } };
const NON_ADMIN_SESSION = { user: { id: "user-1", role: "VEHICLE_USER" } };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  hashPasswordMock.mockImplementation(async (pw: string) => `hashed:${pw}`);
});

describe("createUser", () => {
  it("rejects a non-admin session without touching the database", async () => {
    authMock.mockResolvedValue(NON_ADMIN_SESSION);
    const result = await createUser(
      { success: false },
      formData({ name: "A", email: "a@b.com", password: "longenough", role: "VEHICLE_USER" }),
    );
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns a validation error for a short password", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createUser(
      { success: false },
      formData({ name: "A", email: "a@b.com", password: "short", role: "VEHICLE_USER" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects a duplicate email", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing" });
    const result = await createUser(
      { success: false },
      formData({ name: "A", email: "taken@b.com", password: "longenough", role: "VEHICLE_USER" }),
    );
    expect(result).toEqual({ success: false, error: "A user with this email already exists." });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("hashes the password and creates the user on valid input", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await createUser(
      { success: false },
      formData({ name: "A", email: "new@b.com", password: "longenough", role: "ADMIN" }),
    );
    expect(result).toEqual({ success: true });
    expect(hashPasswordMock).toHaveBeenCalledWith("longenough");
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { name: "A", email: "new@b.com", passwordHash: "hashed:longenough", role: "ADMIN" },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });
});

describe("updateUser", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findFirst.mockResolvedValue(null);
  });

  it("rejects a non-admin session", async () => {
    authMock.mockResolvedValue(NON_ADMIN_SESSION);
    const result = await updateUser(
      { success: false },
      formData({ userId: "u1", name: "A", email: "a@b.com", role: "VEHICLE_USER", newPassword: "" }),
    );
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("does not hash or touch the password when newPassword is blank", async () => {
    const result = await updateUser(
      { success: false },
      formData({ userId: "u1", name: "A", email: "a@b.com", role: "VEHICLE_USER", newPassword: "" }),
    );
    expect(result).toEqual({ success: true });
    expect(hashPasswordMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "A", email: "a@b.com", role: "VEHICLE_USER" },
    });
  });

  it("hashes and includes the password when newPassword is provided", async () => {
    await updateUser(
      { success: false },
      formData({ userId: "u1", name: "A", email: "a@b.com", role: "VEHICLE_USER", newPassword: "longenough" }),
    );
    expect(hashPasswordMock).toHaveBeenCalledWith("longenough");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { name: "A", email: "a@b.com", role: "VEHICLE_USER", passwordHash: "hashed:longenough" },
    });
  });
});

describe("setUserActive", () => {
  it("throws for a non-admin session instead of silently no-op-ing", async () => {
    authMock.mockResolvedValue(NON_ADMIN_SESSION);
    await expect(setUserActive("u1", false)).rejects.toThrow("Admin access required.");
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("updates isActive and revalidates for an admin session", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    await setUserActive("u1", false);
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { isActive: false } });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });
});
