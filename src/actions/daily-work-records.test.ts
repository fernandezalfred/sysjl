import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    dailyWorkRecord: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import {
  createDailyWorkRecord,
  deleteDailyWorkRecord,
  updateDailyWorkRecord,
} from "@/actions/daily-work-records";

const SESSION = { user: { id: "user-1", role: "VEHICLE_USER" } };
const ADMIN_SESSION = { user: { id: "admin-1", role: "ADMIN" } };

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

const VALID_FIELDS = {
  date: "2026-10-27",
  quesoTaken: "80",
  quesoRemaining: "12",
  yogurtTaken: "60",
  yogurtRemaining: "5",
  totalSold: "123",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createDailyWorkRecord", () => {
  it("rejects an unauthenticated session without touching the database", async () => {
    authMock.mockResolvedValue(null);
    const result = await createDailyWorkRecord({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Sign-in required." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("rejects remaining greater than taken", async () => {
    authMock.mockResolvedValue(SESSION);
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, quesoRemaining: "999" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("accepts a total sold that doesn't match Queso sold + Yogurt sold", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, totalSold: "999" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totalSold: 999 }) }),
    );
  });

  it("rejects a duplicate date for the same user", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ id: "existing" });
    const result = await createDailyWorkRecord({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "You already have a record for this date." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("creates the record for the signed-in user on valid input", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        date: new Date("2026-10-27T00:00:00.000Z"),
        quesoTaken: 80,
        quesoRemaining: 12,
        yogurtTaken: 60,
        yogurtRemaining: 5,
        totalSold: 123,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("stores Queso/Yogurt left exactly as entered, without deriving it from taken", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, quesoTaken: "80", quesoRemaining: "30", yogurtTaken: "60", yogurtRemaining: "20" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quesoRemaining: 30, yogurtRemaining: 20 }),
      }),
    );
  });

  it("ignores a client-supplied userId for a non-admin and always uses the session user", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, userId: "someone-else" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-1" }) }),
    );
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects an admin creating a record without selecting a user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createDailyWorkRecord({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Select a user." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("rejects an admin selecting a user that doesn't exist", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, userId: "missing" }),
    );
    expect(result).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("rejects an admin selecting a non-vehicle-user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ id: "admin-2", role: "ADMIN" });
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, userId: "admin-2" }),
    );
    expect(result).toEqual({ success: false, error: "Selected user is not a vehicle user." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("creates the record for the admin-selected vehicle user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ id: "user-2", role: "VEHICLE_USER" });
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, userId: "user-2" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-2" }) }),
    );
  });
});

describe("updateDailyWorkRecord", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(SESSION);
  });

  it("rejects an unauthenticated session", async () => {
    authMock.mockResolvedValue(null);
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "r1" }),
    );
    expect(result).toEqual({ success: false, error: "Sign-in required." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("rejects a record that does not belong to the signed-in user", async () => {
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      id: "r1",
      userId: "someone-else",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "r1" }),
    );
    expect(result).toEqual({ success: false, error: "Record not found." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("updates the record's quantities, keeping its original date", async () => {
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "r1" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: {
        quesoTaken: 80,
        quesoRemaining: 12,
        yogurtTaken: 60,
        yogurtRemaining: 5,
        totalSold: 123,
      },
    });
  });

  it("ignores a client-supplied date on update entirely", async () => {
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "r1", date: "2099-01-01" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.not.objectContaining({ date: expect.anything() }) }),
    );
  });

  it("rejects remaining greater than taken on update", async () => {
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      id: "r1",
      userId: "user-1",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "r1", yogurtRemaining: "999" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("lets an admin update a record owned by another user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      id: "r1",
      userId: "someone-else",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "r1" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "r1" } }),
    );
  });
});

describe("deleteDailyWorkRecord", () => {
  it("rejects an unauthenticated session", async () => {
    authMock.mockResolvedValue(null);
    const result = await deleteDailyWorkRecord("r1");
    expect(result).toEqual({ success: false, error: "Sign-in required." });
    expect(prismaMock.dailyWorkRecord.delete).not.toHaveBeenCalled();
  });

  it("rejects deleting a record that does not belong to the signed-in user", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ id: "r1", userId: "someone-else" });
    const result = await deleteDailyWorkRecord("r1");
    expect(result).toEqual({ success: false, error: "Record not found." });
    expect(prismaMock.dailyWorkRecord.delete).not.toHaveBeenCalled();
  });

  it("rejects deleting a record that doesn't exist", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await deleteDailyWorkRecord("missing");
    expect(result).toEqual({ success: false, error: "Record not found." });
    expect(prismaMock.dailyWorkRecord.delete).not.toHaveBeenCalled();
  });

  it("deletes the record and revalidates when it belongs to the signed-in user", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ id: "r1", userId: "user-1" });
    const result = await deleteDailyWorkRecord("r1");
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
  });

  it("lets an admin delete a record owned by another user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ id: "r1", userId: "someone-else" });
    const result = await deleteDailyWorkRecord("r1");
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.delete).toHaveBeenCalledWith({ where: { id: "r1" } });
  });
});
