"use client";

import { useEffect, useRef } from "react";

const DOUBLE_TAP_MS = 400;
const MAX_DIST = 80;

export function useDoubleTapRefresh(): void {
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });

  useEffect(() => {
    const onTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const now = Date.now();
      const { time, x, y } = lastTapRef.current;
      const dt = now - time;
      const dx = Math.abs(t.clientX - x);
      const dy = Math.abs(t.clientY - y);
      if (dt > 0 && dt < DOUBLE_TAP_MS && dx < MAX_DIST && dy < MAX_DIST) {
        window.location.reload();
        return;
      }
      lastTapRef.current = { time: now, x: t.clientX, y: t.clientY };
    };
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => window.removeEventListener("touchend", onTouchEnd);
  }, []);
}
