import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    dailyWorkRecord: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));

import { createDailyWorkRecord, updateDailyWorkRecord } from "@/actions/daily-work-records";

const SESSION = { user: { id: "user-1", role: "VEHICLE_USER" } };

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
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/records");
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

  it("updates the record when the date is unchanged", async () => {
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
        date: new Date("2026-10-27T00:00:00.000Z"),
        quesoTaken: 80,
        quesoRemaining: 12,
        yogurtTaken: 60,
        yogurtRemaining: 5,
      },
    });
  });

  it("rejects moving to a date that already has a record", async () => {
    prismaMock.dailyWorkRecord.findUnique
      .mockResolvedValueOnce({ id: "r1", userId: "user-1", date: new Date("2026-10-26T00:00:00.000Z") })
      .mockResolvedValueOnce({ id: "r2" });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "r1" }),
    );
    expect(result).toEqual({ success: false, error: "You already have a record for this date." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });
});
