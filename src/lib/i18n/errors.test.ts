import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { localizeError } from "@/lib/i18n/errors";
import { translate, type Locale } from "@/lib/i18n/translations";

const tFor = (locale: Locale) => (key: string) => translate(locale, key);

describe("localizeError", () => {
  it("shows a known server message in Spanish", () => {
    expect(localizeError(tFor("es"), "Select a user.")).toBe("Elige un usuario.");
  });

  it("keeps the English message in English", () => {
    expect(localizeError(tFor("en"), "Select a user.")).toBe("Select a user.");
  });

  it("shows an unknown message as is", () => {
    expect(localizeError(tFor("es"), "Something new.")).toBe("Something new.");
  });

  it("covers every error message the server actions return", () => {
    const dir = join(import.meta.dirname, "../../actions");
    const sources = readdirSync(dir)
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .map((f) => readFileSync(join(dir, f), "utf8"));
    const messages = new Set(
      sources.flatMap((src) => [...src.matchAll(/(?:error: |, |\()"([A-Z][^"]*\.)"/g)].map((m) => m[1])),
    );
    expect(messages.size).toBeGreaterThan(10);
    const untranslated = [...messages].filter((m) => localizeError(tFor("es"), m) === m);
    expect(untranslated).toEqual([]);
  });
});
