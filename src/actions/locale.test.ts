import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookiesStoreMock, cookiesMock } = vi.hoisted(() => {
  const cookiesStoreMock = { set: vi.fn(), get: vi.fn() };
  const cookiesMock = vi.fn(async () => cookiesStoreMock);
  return { cookiesStoreMock, cookiesMock };
});

vi.mock("next/headers", () => ({ cookies: cookiesMock }));

import { setLocale } from "@/actions/locale";
import { LOCALE_COOKIE } from "@/lib/i18n/translations";

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) fd.set(key, value);
  return fd;
}

describe("setLocale", () => {
  beforeEach(() => {
    cookiesStoreMock.set.mockReset();
  });

  it("sets the locale cookie to a valid requested locale", async () => {
    await setLocale(formData({ locale: "es" }));
    expect(cookiesStoreMock.set).toHaveBeenCalledWith(
      LOCALE_COOKIE,
      "es",
      expect.objectContaining({ path: "/", sameSite: "lax" }),
    );
  });

  it("sets the locale cookie for the other valid locale too", async () => {
    await setLocale(formData({ locale: "en" }));
    expect(cookiesStoreMock.set).toHaveBeenCalledWith(
      LOCALE_COOKIE,
      "en",
      expect.objectContaining({ path: "/" }),
    );
  });

  it("does nothing for a locale value that isn't supported", async () => {
    await setLocale(formData({ locale: "fr" }));
    expect(cookiesStoreMock.set).not.toHaveBeenCalled();
  });

  it("does nothing when the locale field is missing", async () => {
    await setLocale(formData({}));
    expect(cookiesStoreMock.set).not.toHaveBeenCalled();
  });

  it("does nothing when the locale field isn't a string", async () => {
    const fd = new FormData();
    fd.set("locale", new Blob(["es"]), "locale.txt");
    await setLocale(fd);
    expect(cookiesStoreMock.set).not.toHaveBeenCalled();
  });
});
