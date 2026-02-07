"use client";

import { useEffect, useState } from "react";
import { isMobileDevice } from "@/lib/device";
import { PC_BREAKPOINT } from "@/lib/constants";

export function useDeviceInfo() {
  const [isMobile, setIsMobile] = useState(false);
  const [isPC, setIsPC] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsMobile(isMobileDevice()), 100);
  }, []);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsPC(w >= PC_BREAKPOINT);
      setIsLandscape(w > h);
    };
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return { isMobile, isPC, isLandscape };
}
