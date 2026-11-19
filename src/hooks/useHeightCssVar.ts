"use client";

import { useEffect, useRef } from "react";

// Keeps a CSS custom property on <html> equal to the element's current height (px),
// so content further down the page can stick just below it with
// top-[var(--name,0px)]. 0px while the element is hidden (display: none).
export function useHeightCssVar<T extends HTMLElement>(name: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty(name, `${el.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(name);
    };
  }, [name]);

  return ref;
}
