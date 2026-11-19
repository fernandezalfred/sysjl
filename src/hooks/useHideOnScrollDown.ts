"use client";

import { useEffect, useState } from "react";

// Pixels the page must move in one direction before the bar hides or shows again,
// so tiny scroll jitters don't make it flicker.
const THRESHOLD = 8;

// true while the user is scrolling down the page (past `startAfter` px from the top);
// false as soon as they scroll back up, and always near the top.
export function useHideOnScrollDown(startAfter = 120): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < startAfter) {
        setHidden(false);
      } else if (y - last > THRESHOLD) {
        setHidden(true);
      } else if (last - y > THRESHOLD) {
        setHidden(false);
      } else {
        return;
      }
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [startAfter]);

  return hidden;
}
