"use client";

import { useEffect } from "react";

// Keeps --vv-height and --vv-top on <html> equal to the part of the screen that's
// actually visible (window.visualViewport). On phones the on-screen keyboard covers
// the bottom of the page without resizing it, so a modal sized with 100dvh ends up
// with its buttons under the keyboard; sizing it with these variables keeps it in view.
export function useVisualViewportCssVars() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const update = () => {
      root.style.setProperty("--vv-height", `${viewport.height}px`);
      root.style.setProperty("--vv-top", `${viewport.offsetTop}px`);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--vv-height");
      root.style.removeProperty("--vv-top");
    };
  }, []);
}
