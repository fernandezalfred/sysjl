// The browser's "install this app" prompt, for the Instalar app button. Chrome, Edge
// and Android fire `beforeinstallprompt` once, often before React has hydrated, so the
// listener is added when this module loads (imported by ServiceWorkerRegister in the
// root layout) and the event is kept until the button uses it. iPhone/iPad Safari has
// no such event: there the button explains how to add the app to the home screen.

// Not in TypeScript's DOM types (Chromium only).
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// What the button does: "prompt" opens the browser's install prompt, "ios" shows the
// Add to Home Screen steps; null hides it (already installed, or not installable here).
export type InstallMode = "prompt" | "ios" | null;

export function installMode({ standalone, hasPrompt, isIos }: { standalone: boolean; hasPrompt: boolean; isIos: boolean }): InstallMode {
  if (standalone) return null;
  if (hasPrompt) return "prompt";
  return isIos ? "ios" : null;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return installed || iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

function isIosDevice(): boolean {
  // iPadOS reports itself as a Mac; a touch screen tells them apart.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function subscribeInstallMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getInstallMode(): InstallMode {
  return installMode({ standalone: isStandalone(), hasPrompt: deferredPrompt !== null, isIos: isIosDevice() });
}

// Opens the browser's install prompt; it can be used only once, so the button then
// hides until the browser offers it again.
export async function promptInstall(): Promise<void> {
  const prompt = deferredPrompt;
  if (!prompt) return;
  deferredPrompt = null;
  await prompt.prompt();
  await prompt.userChoice;
  notify();
}
