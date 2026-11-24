import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, prismaMock, revalidatePathMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  prismaMock: {
    dailyWorkRecord: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    productPrice: {
      findUnique: vi.fn(),
    },
    stockPurchase: {
      findFirst: vi.fn(),
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
  payAllPendingForSeller,
  setRecordPayPaid,
  undoLastPayment,
  updateDailyWorkRecord,
} from "@/actions/daily-work-records";

const SESSION = { user: { id: "aa0000000000000000000001", role: "VEHICLE_USER", companyId: "c1", permissions: [] } };
const ADMIN_SESSION = { user: { id: "ad0000000000000000000001", role: "ADMIN", companyId: "c1", permissions: ["FINANCE", "USERS", "GRAINS", "PRICES"] } };

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
  milkLiters: "30",
  milkUnitCost: "7.5",
};

beforeEach(() => {
  vi.clearAllMocks();
  // No admin-set price yet by default: createDailyWorkRecord falls back to the
  // legacy defaults (Queso 9, Yogurt 33). Individual tests override this.
  prismaMock.productPrice.findUnique.mockResolvedValue(null);
  // …and no purchase cost anywhere, so the snapshotted cost is 0.
  prismaMock.stockPurchase.findFirst.mockResolvedValue(null);
});

describe("createDailyWorkRecord", () => {
  it("rejects an unauthenticated session without touching the database", async () => {
    authMock.mockResolvedValue(null);
    const result = await createDailyWorkRecord({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: false, error: "Sign-in required." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it.each(["", "2026-02-30", "garbage"])("rejects the date %j without touching the database", async (date) => {
    authMock.mockResolvedValue(SESSION);
    const result = await createDailyWorkRecord({ success: false }, formData({ ...VALID_FIELDS, date }));
    expect(result).toEqual({ success: false, error: "Date is required." });
    expect(prismaMock.dailyWorkRecord.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a malformed user id from an admin without querying it", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    const result = await createDailyWorkRecord({ success: false }, formData({ ...VALID_FIELDS, userId: "x" }));
    expect(result).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
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
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ companyId: "c1", id: "existing" });
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
        userId: "aa0000000000000000000001",
        companyId: "c1",
        date: new Date("2026-10-27T00:00:00.000Z"),
        quesoTaken: 80,
        quesoRemaining: 12,
        yogurtTaken: 60,
        yogurtRemaining: 5,
        totalSold: 123,
        milkLiters: 30,
        milkUnitCost: 7.5,
        quesoSalePrice: 9,
        yogurtSalePrice: 33,
        quesoPurchaseCost: 0,
        yogurtPurchaseCost: 0,
      },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects negative Milk liters", async () => {
    authMock.mockResolvedValue(SESSION);
    const result = await createDailyWorkRecord({ success: false }, formData({ ...VALID_FIELDS, milkLiters: "-1" }));
    expect(result).toEqual({ success: false, error: "Milk liters must be 0 or more." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("rejects a negative Milk price per liter", async () => {
    authMock.mockResolvedValue(SESSION);
    const result = await createDailyWorkRecord({ success: false }, formData({ ...VALID_FIELDS, milkUnitCost: "-2" }));
    expect(result).toEqual({ success: false, error: "Milk price per liter must be 0 or more." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("falls back to the legacy default sale prices when the admin hasn't set one yet", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    prismaMock.productPrice.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quesoSalePrice: 9, yogurtSalePrice: 33 }),
      }),
    );
  });

  it("snapshots the admin's current sale price and purchase cost onto the record at creation time", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    prismaMock.productPrice.findUnique.mockImplementation(({ where }: { where: { companyId_product: { product: string } } }) =>
      Promise.resolve(
        where.companyId_product.product === "QUESO"
          ? { salePrice: 10, purchaseCost: 6.5, updatedAt: new Date(), setBy: { name: "Admin" } }
          : { salePrice: 36, purchaseCost: 24, updatedAt: new Date(), setBy: { name: "Admin" } },
      ),
    );
    const result = await createDailyWorkRecord({ success: false }, formData(VALID_FIELDS));
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ quesoSalePrice: 10, yogurtSalePrice: 36, quesoPurchaseCost: 6.5, yogurtPurchaseCost: 24 }),
      }),
    );
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
      expect.objectContaining({ data: expect.objectContaining({ userId: "aa0000000000000000000001" }) }),
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

  it("rejects an admin selecting a deactivated user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ companyId: "c1", id: "aa0000000000000000000003", role: "VEHICLE_USER", isActive: false });
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, userId: "aa0000000000000000000003" }),
    );
    expect(result).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
  });

  it("creates the record for an admin-selected active admin", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ companyId: "c1", id: "ad0000000000000000000002", role: "ADMIN", isActive: true });
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, userId: "ad0000000000000000000002" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "ad0000000000000000000002" }) }),
    );
  });

  it("creates the record for the admin-selected vehicle user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ companyId: "c1", id: "aa0000000000000000000002", role: "VEHICLE_USER", isActive: true });
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await createDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, userId: "aa0000000000000000000002" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "aa0000000000000000000002", companyId: "c1" }) }),
    );
  });

  it("rejects an admin selecting a seller of another company", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.user.findUnique.mockResolvedValue({ companyId: "c2", id: "aa0000000000000000000009", role: "VEHICLE_USER", isActive: true });
    const result = await createDailyWorkRecord({ success: false }, formData({ ...VALID_FIELDS, userId: "aa0000000000000000000009" }));
    expect(result).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.dailyWorkRecord.create).not.toHaveBeenCalled();
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
      formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001" }),
    );
    expect(result).toEqual({ success: false, error: "Sign-in required." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("rejects a record that does not belong to the signed-in user", async () => {
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      companyId: "c1", id: "dd0000000000000000000001",
      userId: "someone-else",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001" }),
    );
    expect(result).toEqual({ success: false, error: "Record not found." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("updates the record's quantities on the same date", async () => {
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      companyId: "c1", id: "dd0000000000000000000001",
      userId: "aa0000000000000000000001",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.update).toHaveBeenCalledWith({
      where: { id: "dd0000000000000000000001" },
      data: {
        date: new Date("2026-10-27T00:00:00.000Z"),
        quesoTaken: 80,
        quesoRemaining: 12,
        yogurtTaken: 60,
        yogurtRemaining: 5,
        totalSold: 123,
        milkLiters: 30,
        milkUnitCost: 7.5,
      },
    });
  });

  it("moves the record to another day", async () => {
    prismaMock.dailyWorkRecord.findUnique
      .mockResolvedValueOnce({
        companyId: "c1", id: "dd0000000000000000000001",
        userId: "aa0000000000000000000001",
        date: new Date("2026-10-27T00:00:00.000Z"),
      })
      .mockResolvedValueOnce(null);
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001", date: "2026-10-25" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.findUnique).toHaveBeenLastCalledWith({
      where: { userId_date: { userId: "aa0000000000000000000001", date: new Date("2026-10-25T00:00:00.000Z") } },
    });
    expect(prismaMock.dailyWorkRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ date: new Date("2026-10-25T00:00:00.000Z") }) }),
    );
  });

  it("refuses moving the record onto a day the seller already has", async () => {
    prismaMock.dailyWorkRecord.findUnique
      .mockResolvedValueOnce({
        companyId: "c1", id: "dd0000000000000000000001",
        userId: "aa0000000000000000000001",
        date: new Date("2026-10-27T00:00:00.000Z"),
      })
      .mockResolvedValueOnce({ id: "dd0000000000000000000002" });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001", date: "2026-10-25" }),
    );
    expect(result).toEqual({ success: false, error: "You already have a record for this date." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("rejects a future date or a missing date on update", async () => {
    for (const date of ["2099-01-01", ""]) {
      const result = await updateDailyWorkRecord(
        { success: false },
        formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001", date }),
      );
      expect(result.success).toBe(false);
    }
    expect(prismaMock.dailyWorkRecord.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("rejects remaining greater than taken on update", async () => {
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      companyId: "c1", id: "dd0000000000000000000001",
      userId: "aa0000000000000000000001",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001", yogurtRemaining: "999" }),
    );
    expect(result.success).toBe(false);
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("lets an admin update a record owned by another user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({
      companyId: "c1", id: "dd0000000000000000000001",
      userId: "someone-else",
      date: new Date("2026-10-27T00:00:00.000Z"),
    });
    const result = await updateDailyWorkRecord(
      { success: false },
      formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001" }),
    );
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "dd0000000000000000000001" } }),
    );
  });

  it("treats another company's record as not found, for its own admin too", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ companyId: "c2", id: "dd0000000000000000000001", userId: "someone-else" });
    const result = await updateDailyWorkRecord({ success: false }, formData({ ...VALID_FIELDS, recordId: "dd0000000000000000000001" }));
    expect(result).toEqual({ success: false, error: "Record not found." });
    expect(await deleteDailyWorkRecord("dd0000000000000000000001")).toEqual({ success: false, error: "Record not found." });
    expect(await setRecordPayPaid("dd0000000000000000000001", true)).toEqual({ success: false, error: "Record not found." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
    expect(prismaMock.dailyWorkRecord.delete).not.toHaveBeenCalled();
  });
});

describe("deleteDailyWorkRecord", () => {
  it("rejects an unauthenticated session", async () => {
    authMock.mockResolvedValue(null);
    const result = await deleteDailyWorkRecord("dd0000000000000000000001");
    expect(result).toEqual({ success: false, error: "Sign-in required." });
    expect(prismaMock.dailyWorkRecord.delete).not.toHaveBeenCalled();
  });

  it("rejects deleting a record that does not belong to the signed-in user", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ companyId: "c1", id: "dd0000000000000000000001", userId: "someone-else" });
    const result = await deleteDailyWorkRecord("dd0000000000000000000001");
    expect(result).toEqual({ success: false, error: "Record not found." });
    expect(prismaMock.dailyWorkRecord.delete).not.toHaveBeenCalled();
  });

  it("rejects deleting a record that doesn't exist", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await deleteDailyWorkRecord("missing");
    expect(result).toEqual({ success: false, error: "Record not found." });
    expect(prismaMock.dailyWorkRecord.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.dailyWorkRecord.delete).not.toHaveBeenCalled();
  });

  it("deletes the record and revalidates when it belongs to the signed-in user", async () => {
    authMock.mockResolvedValue(SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ companyId: "c1", id: "dd0000000000000000000001", userId: "aa0000000000000000000001" });
    const result = await deleteDailyWorkRecord("dd0000000000000000000001");
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.delete).toHaveBeenCalledWith({ where: { id: "dd0000000000000000000001" } });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("lets an admin delete a record owned by another user", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ companyId: "c1", id: "dd0000000000000000000001", userId: "someone-else" });
    const result = await deleteDailyWorkRecord("dd0000000000000000000001");
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.delete).toHaveBeenCalledWith({ where: { id: "dd0000000000000000000001" } });
  });
});

describe("setRecordPayPaid", () => {
  it("rejects a non-admin session without touching the database", async () => {
    authMock.mockResolvedValue(SESSION);
    const result = await setRecordPayPaid("ee0000000000000000000001", true);
    expect(result).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("returns an error when the record does not exist", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue(null);
    const result = await setRecordPayPaid("missing", true);
    expect(result).toEqual({ success: false, error: "Record not found." });
    expect(prismaMock.dailyWorkRecord.update).not.toHaveBeenCalled();
  });

  it("marks the pay as paid with the current time", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ companyId: "c1", id: "ee0000000000000000000001" });
    const result = await setRecordPayPaid("ee0000000000000000000001", true);
    expect(result).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.update).toHaveBeenCalledWith({
      where: { id: "ee0000000000000000000001" },
      data: { payPaidAt: expect.any(Date) },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard");
  });

  it("undoes the paid mark", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.findUnique.mockResolvedValue({ companyId: "c1", id: "ee0000000000000000000001" });
    await setRecordPayPaid("ee0000000000000000000001", false);
    expect(prismaMock.dailyWorkRecord.update).toHaveBeenCalledWith({
      where: { id: "ee0000000000000000000001" },
      data: { payPaidAt: null },
    });
  });
});

describe("payAllPendingForSeller", () => {
  const SELLER_ID = "aa0000000000000000000001";

  it("rejects a seller", async () => {
    authMock.mockResolvedValue(SESSION);
    expect(await payAllPendingForSeller(SELLER_ID)).toEqual({ success: false, error: "Admin access required." });
    expect(prismaMock.dailyWorkRecord.updateMany).not.toHaveBeenCalled();
  });

  it("rejects an id that isn't an ObjectId without touching the database", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    expect(await payAllPendingForSeller("nope")).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.dailyWorkRecord.updateMany).not.toHaveBeenCalled();
  });

  it("marks only that seller's unpaid days of the admin's company as paid", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.updateMany.mockResolvedValue({ count: 3 });
    expect(await payAllPendingForSeller(SELLER_ID)).toEqual({ success: true });
    const call = prismaMock.dailyWorkRecord.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({
      companyId: "c1",
      userId: SELLER_ID,
      OR: [{ payPaidAt: null }, { payPaidAt: { isSet: false } }],
    });
    // One timestamp for every day, so the whole payment can be undone together.
    expect(call.data).toEqual({ payPaidAt: expect.any(Date) });
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });
});

describe("undoLastPayment", () => {
  const SELLER_ID = "aa0000000000000000000001";

  it("rejects a seller and an invalid id", async () => {
    authMock.mockResolvedValue(SESSION);
    expect(await undoLastPayment(SELLER_ID)).toEqual({ success: false, error: "Admin access required." });
    authMock.mockResolvedValue(ADMIN_SESSION);
    expect(await undoLastPayment("nope")).toEqual({ success: false, error: "User not found." });
    expect(prismaMock.dailyWorkRecord.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.dailyWorkRecord.updateMany).not.toHaveBeenCalled();
  });

  it("refuses while the seller still has unpaid days", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.count.mockResolvedValue(2);
    expect(await undoLastPayment(SELLER_ID)).toEqual({ success: false, error: "Pay what's owed first." });
    expect(prismaMock.dailyWorkRecord.count).toHaveBeenCalledWith({
      where: { companyId: "c1", userId: SELLER_ID, OR: [{ payPaidAt: null }, { payPaidAt: { isSet: false } }] },
    });
    expect(prismaMock.dailyWorkRecord.updateMany).not.toHaveBeenCalled();
  });

  it("says there's nothing to undo when the seller has no paid day in the company", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.count.mockResolvedValue(0);
    prismaMock.dailyWorkRecord.findFirst.mockResolvedValue(null);
    expect(await undoLastPayment(SELLER_ID)).toEqual({ success: false, error: "Nothing to undo." });
    expect(prismaMock.dailyWorkRecord.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: "c1", userId: SELLER_ID, payPaidAt: { not: null } } }),
    );
    expect(prismaMock.dailyWorkRecord.updateMany).not.toHaveBeenCalled();
  });

  it("puts only the days of the latest payment back as unpaid", async () => {
    authMock.mockResolvedValue(ADMIN_SESSION);
    prismaMock.dailyWorkRecord.count.mockResolvedValue(0);
    const paidAt = new Date("2026-11-20T12:00:00Z");
    prismaMock.dailyWorkRecord.findFirst.mockResolvedValue({ payPaidAt: paidAt });
    expect(await undoLastPayment(SELLER_ID)).toEqual({ success: true });
    expect(prismaMock.dailyWorkRecord.findFirst).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { payPaidAt: "desc" } }));
    expect(prismaMock.dailyWorkRecord.updateMany).toHaveBeenCalledWith({
      where: { companyId: "c1", userId: SELLER_ID, payPaidAt: paidAt },
      data: { payPaidAt: null },
    });
  });
});
