"use client";

import { useEffect, useState, type RefObject } from "react";
import { PADDING_V, PADDING_H } from "@/lib/constants";

export function useContentScale(contentRef: RefObject<HTMLDivElement | null>): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const measure = () => {
      const el = contentRef.current;
      if (!el) return;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const contentH = el.scrollHeight;
      const contentW = el.scrollWidth;
      const scaleY = (vh - PADDING_V) / contentH;
      const scaleX = (vw - PADDING_H) / contentW;
      setScale(Math.min(1, scaleY, scaleX));
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 150);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [contentRef]);

  return scale;
}
