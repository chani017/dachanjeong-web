"use client";

import { useEffect } from "react";

export function useOrientationLock(): void {
  useEffect(() => {
    const lockPortrait = async () => {
      try {
        const o = (window as Window & { screen?: { orientation?: { lock?: (v: string) => Promise<void> } } }).screen?.orientation;
        if (o?.lock) await o.lock("portrait");
      } catch {
        /* 미지원 시 무시 */
      }
    };
    const onOrientationChange = () => {
      if (typeof window !== "undefined" && window.innerWidth <= window.innerHeight) {
        lockPortrait();
      }
    };
    if (typeof window !== "undefined" && window.innerWidth <= window.innerHeight) {
      lockPortrait();
    }
    window.addEventListener("orientationchange", onOrientationChange);
    return () => window.removeEventListener("orientationchange", onOrientationChange);
  }, []);
}
