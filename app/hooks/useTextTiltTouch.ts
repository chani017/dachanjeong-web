"use client";

import { useEffect } from "react";

const TILT_SELECTOR = ".text-hover-tilt";

export function useTextTiltTouch(): void {
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const el = (e.target as Element).closest(TILT_SELECTOR);
      if (el) el.classList.add("tilt-active");
    };
    const onTouchEnd = (e: TouchEvent) => {
      const el = (e.target as Element).closest(TILT_SELECTOR);
      if (el) el.classList.remove("tilt-active");
    };
    const onTouchCancel = (e: TouchEvent) => {
      const el = (e.target as Element).closest(TILT_SELECTOR);
      if (el) el.classList.remove("tilt-active");
    };
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, []);
}
