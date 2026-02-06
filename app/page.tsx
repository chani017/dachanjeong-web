"use client";

import Image from "next/image";
import Text from "./components/Text";
import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import useSound from "use-sound";

interface Circle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  phase: number; // 물결마다 다른 위상 (살랑거림)
}

const PC_BREAKPOINT = 768;
const PADDING_V = 32;
const PADDING_H = 32;

/** 해상도 말고 기기 종류로 모바일 여부 판별 (User-Agent + Client Hints) */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (uaData?.mobile === true) return true;
  const mobilePattern = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i;
  return mobilePattern.test(ua);
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
function lightenHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}
function darkenHex(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<Circle[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);
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
  const [playPop6] = useSound("/sounds/pop-6.mp3", { volume: 0.6 });

  const playRandomPop = useCallback(() => {
    const playFns = [playPop1, playPop2, playPop3, playPop4, playPop5, playPop6];
    const i = Math.floor(Math.random() * 6);
    playFns[i]();
  }, [playPop1, playPop2, playPop3, playPop4, playPop5, playPop6]);

  const onTouchStartPop = useCallback(() => {
    lastTouchForPopRef.current = Date.now();
    playRandomPop();
  }, [playRandomPop]);

  const onClickPop = useCallback(() => {
    if (Date.now() - lastTouchForPopRef.current < 400) return;
    playRandomPop();
  }, [playRandomPop]);

  const initCircles = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const circles: Circle[] = [];
    
    const colorPalette = ["#0066ff", "#ff0022", "#ffc000"];
    const getRandomColor = () =>
      colorPalette[Math.floor(Math.random() * colorPalette.length)];

    const MIN_SIZE = 80;
    const MAX_SIZE = 280;
    const MAX_SIZE_THRESHOLD = 270;
    const MAX_LARGE_COUNT = 2; // 모바일 기기에서만: 최대 크기 원 2개까지

    const isMobile = isMobileDevice();
    const circleCount = isMobile ? 10 : 36;

    const sizes: number[] = [];
    if (isMobile) {
      // 모바일: 최대 크기 원 2개 제한
      let largeCount = 0;
      for (let i = 0; i < circleCount; i++) {
        let size: number;
        if (largeCount < MAX_LARGE_COUNT && Math.random() < 0.15) {
          size = Math.random() * (MAX_SIZE - MAX_SIZE_THRESHOLD) + MAX_SIZE_THRESHOLD;
          largeCount++;
        } else {
          size = Math.random() * (MAX_SIZE_THRESHOLD - MIN_SIZE) + MIN_SIZE;
        }
        sizes.push(size);
      }
    } else {
      // PC: 제한 없이 랜덤
      for (let i = 0; i < circleCount; i++) {
        sizes.push(Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE);
      }
    }

    for (let i = 0; i < circleCount; i++) {
      const size = sizes[i];
      const r = size / 2;
      circles.push({
        x: r + Math.random() * (w - size),
        y: r + Math.random() * (h - size),
        vx: 0,
        vy: 0,
        size,
        color: getRandomColor(),
        phase: Math.random() * Math.PI * 2,
      });
    }
    circlesRef.current = circles;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let logicalW = window.innerWidth;
    let logicalH = window.innerHeight;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      logicalW = w;
      logicalH = h;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    initCircles();

    // 그레인 텍스처 1회 생성
    const GRAIN_SIZE = 1024;
    const grainCanvas = document.createElement("canvas");
    grainCanvas.width = GRAIN_SIZE;
    grainCanvas.height = GRAIN_SIZE;
    const grainCtx = grainCanvas.getContext("2d");
    if (grainCtx) {
      const id = grainCtx.getImageData(0, 0, GRAIN_SIZE, GRAIN_SIZE);
      for (let i = 0; i < id.data.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * 60;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
        id.data[i + 3] = Math.floor(Math.random() * 24) + 4;
      }
      grainCtx.putImageData(id, 0, 0);
    }

    window.addEventListener("resize", resize);

    const handlePointer = (x: number, y: number) => {
      pointerRef.current = { x, y };
    };

    const onMouseMove = (e: MouseEvent) => handlePointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) handlePointer(t.clientX, t.clientY);
    };
    const onPointerLeave = () => {
      pointerRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("touchend", onPointerLeave);

    let time = 0;
    const animate = () => {
      time = performance.now() * 0.001;
      ctx.clearRect(0, 0, logicalW, logicalH);
      const { x: px, y: py } = pointerRef.current;
      const pushRadius = 600;
      const pushStrength = 2.5;

      for (const c of circlesRef.current) {
        const dx = c.x - px;
        const dy = c.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < pushRadius + c.size / 2 && dist > 0) {
          const force = pushStrength * (1 - dist / (pushRadius + c.size / 2));
          c.vx -= (dx / dist) * force;
          c.vy -= (dy / dist) * force;
        } else {
          // 터치 없을 때: 물에 떠 있는 것처럼 살랑살랑 (파동 + 미세 랜덤)
          const waveX = Math.sin(time * 1.1 + c.phase) * 0.08 + Math.sin(time * 0.7 + c.phase * 1.5) * 0.04;
          const waveY = Math.cos(time * 0.9 + c.phase * 1.2) * 0.08 + Math.cos(time * 0.6 + c.phase * 0.8) * 0.04;
          c.vx += waveX + (Math.random() - 0.5) * 0.06;
          c.vy += waveY + (Math.random() - 0.5) * 0.06;
        }

        // 마찰 낮춤 → 더 오래 흔들림 (물 위 느낌)
        c.vx *= 0.9;
        c.vy *= 0.9;

        if (Math.abs(c.vx) < 0.02) c.vx *= 0.5;
        if (Math.abs(c.vy) < 0.02) c.vy *= 0.5;
      }

      // 원끼리 충돌 처리 (여러 번 반복해 안정화)
      const circles = circlesRef.current;
      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < circles.length; i++) {
          for (let j = i + 1; j < circles.length; j++) {
            const a = circles[i];
            const b = circles[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = (a.size + b.size) / 2;

            if (dist < minDist && dist > 0) {
              const overlap = (minDist - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;

              // 위치 보정 (튕겨내는 힘을 줄이기 위해 0.5배로 감소)
              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
              b.x += nx * overlap * 0.5;
              b.y += ny * overlap * 0.5;
            }
          }
        }
      }

      // 위치 업데이트, 경계 처리, 그리기 (논리 픽셀 기준)
      const cw = logicalW;
      const ch = logicalH;
      for (const c of circles) {
        c.x += c.vx;
        c.y += c.vy;

        // 화면 밖으로 나가지 않도록
        const r = c.size / 2;
        if (c.x < r) { c.x = r; c.vx = 0; }
        if (c.x > cw - r) { c.x = cw - r; c.vx = 0; }
        if (c.y < r) { c.y = r; c.vy = 0; }
        if (c.y > ch - r) { c.y = ch - r; c.vy = 0; }

        // 엠보싱: 왼쪽 위에서 비치는 광원으로 입체감
        const lightOffset = r * 0.65;
        const gx = c.x - lightOffset;
        const gy = c.y - lightOffset;
        const grad = ctx.createRadialGradient(gx, gy, 0, c.x, c.y, r);
        grad.addColorStop(0, lightenHex(c.color, 85));
        grad.addColorStop(0, c.color);
        grad.addColorStop(0.85, lightenHex(c.color, 55));
        grad.addColorStop(1, lightenHex(c.color, 90));
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // 원 안에만 그레인 적용 (multiply 블렌드)
        if (grainCtx) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.globalCompositeOperation = "multiply";
          ctx.globalAlpha = 10;
          ctx.drawImage(grainCanvas, 0, 0, GRAIN_SIZE, GRAIN_SIZE, c.x - r, c.y - r, r * 4, r * 4);
          ctx.restore();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onPointerLeave);
      window.removeEventListener("touchend", onPointerLeave);
    };
  }, [initCircles]);

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

  // 세로 모드만: 가로일 때 안내 표시 + 세로일 때 orientation lock 시도
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    const lockPortrait = async () => {
      try {
        const o = (window as Window & { screen?: { orientation?: { lock?: (v: string) => Promise<void> } } }).screen?.orientation;
        if (o?.lock) await o.lock("portrait");
      } catch {
        /* 미지원 시 무시 */
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

  // 모바일: 손가락이 닿을 때만 글자 기울임, 떼면 복귀
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

  // 빠른 두 번 터치 시 새로고침
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
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white px-6"
          style={{ fontFamily: "Gabarito, sans-serif" }}
        >
          <p className="text-2xl font-bold text-black text-center">
            Turn your device to portrait mode.
          </p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
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
        <main className="grid grid-cols-2" style={{ gap: "2vw" }}>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <span className="inline-block">
              <Text size="large" weight="medium">Dachan Jeong</Text>
            </span>
          </div>
          <div className="col-span-1 border-b-vw pt-[0.8vw]" style={{ paddingBottom: "2vw" }}>
            <span className="inline-block">
              <Text size="small" weight="bold">
                Based in<br />South Korea
              </Text>
            </span>
          </div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}></div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
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
          </div>
          <div className="col-span-2 relative" style={{ paddingBottom: "4vw" }}>
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
            <div className="absolute bottom-0 left-0 w-[49%] border-b-vw"></div>
            <div className="absolute bottom-0 right-0 w-[49%] border-b-vw"></div>
          </div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
          </div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <span className="inline-block">
              <Text size="large" weight="medium">–Based<br /><span className="opacity-0">-</span><br /></Text>
            </span>
          </div>
          <div className="col-span-2 relative" style={{ paddingBottom: "4vw" }}>
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
            <div className="absolute bottom-0 left-0 w-[49%] border-b-vw"></div>
            <div className="absolute bottom-0 right-0 w-[49%] border-b-vw"></div>
          </div>
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
          <div className="col-span-1">
            <span className="inline-block">
              <Text size="large" weight="medium">Through Code.</Text>
            </span>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
