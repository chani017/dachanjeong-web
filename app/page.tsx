"use client";

import Image from "next/image";
import Text from "./components/Text";
import BgCircles from "./components/BgCircles";
import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import useSound from "use-sound";

const PC_BREAKPOINT = 768;
const PADDING_V = 32;
const PADDING_H = 32;

function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (uaData?.mobile === true) return true;
  const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i;
  return mobilePattern.test(ua);
}

export default function Home() {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const lastTouchForPopRef = useRef(0);
  const [scale, setScale] = useState(1);
  const [isPC, setIsPC] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [playPop1] = useSound("/sounds/pop-1.mp3", { volume: 0.6 });
  const [playPop2] = useSound("/sounds/pop-2.mp3", { volume: 0.6 });
  const [playPop3] = useSound("/sounds/pop-3.mp3", { volume: 0.6 });
  const [playPop4] = useSound("/sounds/pop-4.mp3", { volume: 0.6 });
  const [playPop5] = useSound("/sounds/pop-5.mp3", { volume: 0.6 });

  const playRandomPop = useCallback(() => {
    const playFns = [playPop1, playPop2, playPop3, playPop4, playPop5];
    const i = Math.floor(Math.random() * 5);
    playFns[i]();
  }, [playPop1, playPop2, playPop3, playPop4, playPop5]);

  const onTouchStartPop = useCallback(() => {
    lastTouchForPopRef.current = Date.now();
    playRandomPop();
  }, [playRandomPop]);

  const onClickPop = useCallback(() => {
    if (Date.now() - lastTouchForPopRef.current < 400) return;
    playRandomPop();
  }, [playRandomPop]);

  // 창/해상도/비율 관계없이 글자·border 레이어가 잘리면 가로세로비 유지한 채 스케일 축소로 전부 들어오도록
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      setIsPC(w >= PC_BREAKPOINT);
      const el = contentRef.current;
      if (!el) return;
      const vh = window.innerHeight;
      const vw = w;
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
  }, []);
  
  useEffect(() => {
    setTimeout(() => {
      setIsMobile(isMobileDevice());
    }, 100);
  }, []);

  // 세로 모드만
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    const lockPortrait = async () => {
      try {
        const o = (window as Window & { screen?: { orientation?: { lock?: (v: string) => Promise<void> } } }).screen?.orientation;
        if (o?.lock) await o.lock("portrait");
      } catch {
      }
    };
    const onOrientationChange = () => {
      check();
      if (window.innerWidth <= window.innerHeight) lockPortrait();
    };
    check();
    if (typeof window !== "undefined" && window.innerWidth <= window.innerHeight) lockPortrait();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", onOrientationChange);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", onOrientationChange);
    };
  }, []);

  // 모바일 호버
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const el = (e.target as Element).closest(".text-hover-tilt");
      if (el) el.classList.add("tilt-active");
    };
    const onTouchEnd = (e: TouchEvent) => {
      const el = (e.target as Element).closest(".text-hover-tilt");
      if (el) el.classList.remove("tilt-active");
    };
    const onTouchCancel = (e: TouchEvent) => {
      const el = (e.target as Element).closest(".text-hover-tilt");
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

  // 더블탭 새로고침
  useEffect(() => {
    const DOUBLE_TAP_MS = 400;
    const MAX_DIST = 80;

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

  return (
    <div
      className="min-h-screen h-screen relative overflow-hidden select-none md:h-screen"
      style={{
        fontFamily: "Gabarito, sans-serif",
        backgroundColor: "var(--background)",
      }}
    >
      {isLandscape && isMobile && (
        <aside
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6"
          style={{ fontFamily: "Gabarito, sans-serif" }}
        >
          <p className="text-2xl font-bold text-black text-center">
            Turn your device to portrait mode.
          </p>
        </aside>
      )}

      <BgCircles />
      <div
        className="relative z-50 w-full h-full md:overflow-hidden md:flex md:items-start md:justify-start"
        onTouchStart={onTouchStartPop}
        onClick={onClickPop}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          ref={contentRef}
          className={`w-full ${scale < 1 ? "absolute top-0 left-0" : ""}`}
          style={{
            padding: "2vw",
            ...(scale < 0.9
              ? { transformOrigin: "top left", transform: `scale(${scale})` }
              : {}),
          }}
        >
        <main
          className="grid grid-cols-2"
          style={{ gap: "2vw" }}
        >
          <section
            className="col-span-2"
            style={{ display: "contents" }}
          >
            <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
              <span className="inline-block">
                <Text size="large" weight="medium">Dachan Jeong</Text>
              </span>
            </div>
            <div className="col-span-1 border-b-vw pt-[0.8vw]" style={{ paddingBottom: "2vw" }}>
              <span className="inline-block">
                <Text size="small" weight="bold">
                  Based in<br />Seoul
                </Text>
              </span>
            </div>
          </section>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }} />
          <nav className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <span className="text-hover-tilt inline-block">
              <Link href="https://www.instagram.com/chandajeong/">
                <Text size="large" weight="medium">
                  Insta<br />
                  <span className="inline-flex items-baseline" style={{ gap: "1vw" }}>
                    gram
                    <Image src="/link.svg" alt="link" width={38} height={29} className="inline-block align-baseline w-[7vw] h-auto"/>
                  </span>
                </Text>
              </Link>
            </span>
          </nav>
          <section className="col-span-2 relative" style={{ paddingBottom: "4vw" }}>
            <span className="inline-block">
              <Text size="large" weight="medium" withBorder={false}>
                A Graphic 
                <span className="inline-block" style={{ marginLeft: "2vw" }}>
                  <Text size="small" weight="bold">
                    Typography<br />Editorial
                  </Text>
                </span> 
                <br />design
              </Text>
            </span>
            <div className="absolute bottom-0 left-0 w-[49%] border-b-vw" />
            <div className="absolute bottom-0 right-0 w-[49%] border-b-vw" />
          </section>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }} />
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <span className="inline-block">
              <Text size="large" weight="medium">–Based<br /><span className="opacity-0">-</span><br /></Text>
            </span>
          </div>
          <section className="col-span-2 relative" style={{ paddingBottom: "4vw" }}>
            <span className="inline-block">
              <Text size="large" weight="medium" withBorder={false}>
                Creative
                <span className="inline-block" style={{ marginLeft: "2vw" }}>
                  <Text size="small" weight="bold">
                    Interactive<br />Web
                  </Text>
                </span> 
                <br />Coder
              </Text>
            </span>
            <div className="absolute bottom-0 left-0 w-[49%] border-b-vw" />
            <div className="absolute bottom-0 right-0 w-[49%] border-b-vw" />
          </section>
          <section className="col-span-2" style={{ display: "contents" }}>
            <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
              <span className="inline-block">
                <Text size="large" weight="medium">Making</Text>
              </span>
            </div>
            <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
              <span className="inline-block">
                <Text size="large" weight="medium">Visual
                  <span className="inline-block" style={{ marginLeft: "2vw" }}>
                    <Text size="small" weight="bold">
                      2D<br />3D
                    </Text>
                  </span> 
                  Systems
                </Text>
              </span>
            </div>
          </section>
          <section className="col-span-1">
            <span className="inline-block">
              <Text size="large" weight="medium">Through Code.</Text>
            </span>
          </section>
        </main>
        </div>
      </div>
    </div>
  );
}
