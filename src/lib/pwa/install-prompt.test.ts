import { describe, expect, it } from "vitest";
import { installMode } from "@/lib/pwa/install-prompt";

describe("installMode", () => {
  it("hides the button once the app runs installed", () => {
    expect(installMode({ standalone: true, hasPrompt: true, isIos: false })).toBeNull();
    expect(installMode({ standalone: true, hasPrompt: false, isIos: true })).toBeNull();
  });

  it("uses the browser's prompt when there is one", () => {
    expect(installMode({ standalone: false, hasPrompt: true, isIos: false })).toBe("prompt");
  });

  it("explains Add to Home Screen on iPhone/iPad", () => {
    expect(installMode({ standalone: false, hasPrompt: false, isIos: true })).toBe("ios");
  });

  it("hides the button where the app can't be installed", () => {
    expect(installMode({ standalone: false, hasPrompt: false, isIos: false })).toBeNull();
  });
});
