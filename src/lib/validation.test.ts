import { describe, expect, it } from "vitest";
import { DATE_KEY, EMAIL, NEW_PASSWORD, objectIdSchema, PERSON_NAME } from "@/lib/validation";

describe("objectIdSchema", () => {
  const schema = objectIdSchema("Record not found.");

  it("accepts a 24-character hex id", () => {
    expect(schema.safeParse("65a1f0c2e4b0a1b2c3d4e5f6").success).toBe(true);
  });

  it.each(["", "r1", "65a1f0c2e4b0a1b2c3d4e5fz", "65a1f0c2e4b0a1b2c3d4e5f6a"])("refuses %j with the given message", (id) => {
    const result = schema.safeParse(id);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Record not found.");
  });

  it("refuses anything that isn't a string, like a query object", () => {
    expect(schema.safeParse({ not: "" }).success).toBe(false);
  });
});

describe("DATE_KEY", () => {
  it("accepts a real calendar day", () => {
    expect(DATE_KEY.safeParse("2026-02-28").success).toBe(true);
  });

  it.each(["", "2026-2-28", "2026-02-30", "2026-13-01", "not-a-date"])("refuses %j", (key) => {
    expect(DATE_KEY.safeParse(key).success).toBe(false);
  });
});

describe("NEW_PASSWORD", () => {
  it("accepts 8 to 72 characters", () => {
    expect(NEW_PASSWORD.safeParse("12345678").success).toBe(true);
    expect(NEW_PASSWORD.safeParse("x".repeat(72)).success).toBe(true);
  });

  it("refuses a password bcrypt would cut short", () => {
    expect(NEW_PASSWORD.safeParse("x".repeat(73)).error?.issues[0]?.message).toBe("Password must be at most 72 characters.");
    // 37 two-byte characters are 74 bytes.
    expect(NEW_PASSWORD.safeParse("ñ".repeat(37)).success).toBe(false);
  });
});

describe("PERSON_NAME and EMAIL", () => {
  it("trims, and refuses blank or overlong values", () => {
    expect(PERSON_NAME.parse("  Ana  ")).toBe("Ana");
    expect(PERSON_NAME.safeParse("   ").success).toBe(false);
    expect(PERSON_NAME.safeParse("a".repeat(101)).error?.issues[0]?.message).toBe("Name is too long.");
    expect(EMAIL.parse(" ana@example.com ")).toBe("ana@example.com");
    expect(EMAIL.safeParse(`${"a".repeat(250)}@b.co`).success).toBe(false);
  });
});
