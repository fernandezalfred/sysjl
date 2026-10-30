import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, defaultT, translate } from "@/lib/i18n/translations";

describe("translate", () => {
  it("returns the English string for a known key", () => {
    expect(translate("en", "header.signIn")).toBe("Sign in");
  });

  it("returns the Spanish string for the same key", () => {
    expect(translate("es", "header.signIn")).toBe("Iniciar sesión");
  });

  it("falls back to the key itself for an unknown key", () => {
    expect(translate("en", "nonexistent.key")).toBe("nonexistent.key");
  });

  it("substitutes a single {placeholder}", () => {
    expect(translate("en", "records.totalSold")).toBe("Total sold");
    expect(translate("en", "footer.rights", { year: 2026 })).toBe(
      "© 2026 SysJL. All rights reserved.",
    );
  });

  it("substitutes multiple {placeholders} independently", () => {
    expect(
      translate("en", "cell.leftValue", { left: "Bs 10,00", total: "Bs 50,00" }),
    ).toBe("Bs 10,00 left, value Bs 50,00");
    expect(
      translate("es", "cell.leftValue", { left: "Bs 10,00", total: "Bs 50,00" }),
    ).toBe("Bs 10,00 restante, valor Bs 50,00");
  });

  it("leaves a key with no vars argument untouched by interpolation", () => {
    expect(translate("en", "header.dashboard")).toBe("Dashboard");
  });
});

describe("defaultT", () => {
  it("always translates using the default locale regardless of what the caller passes", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(defaultT("header.signOut")).toBe(translate("en", "header.signOut"));
  });

  it("supports interpolation like translate() does", () => {
    expect(defaultT("footer.rights", { year: 2030 })).toBe(
      "© 2030 SysJL. All rights reserved.",
    );
  });
});
