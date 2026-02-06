"use client";

import Image from "next/image";
import Text from "./components/Text";
import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";

interface Circle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const PC_BREAKPOINT = 768;
const PADDING_V = 32;
const PADDING_H = 32;

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const circlesRef = useRef<Circle[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPC, setIsPC] = useState(false);

  const initCircles = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const circles: Circle[] = [];
    
    const colorPalette = ["#0a66dd", "#ff3300", "#ffca00"];
    const getRandomColor = () =>
      colorPalette[Math.floor(Math.random() * colorPalette.length)];

    const MIN_SIZE = 80;
    const MAX_SIZE = 280;
    const MAX_SIZE_THRESHOLD = 270;
    const MAX_LARGE_COUNT = 2; // 모바일에서만: 최대 크기 원 2개까지

    const isPC = w >= 768;
    const circleCount = isPC ? 36 : 10;
    const isMobile = !isPC;

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

    const animate = () => {
      ctx.clearRect(0, 0, logicalW, logicalH);
      const { x: px, y: py } = pointerRef.current;
      const pushRadius = 600;  // 반경 2배 (기존 300)
      const pushStrength = 2.5;  // 속도 1/2 (기존 5)

      for (const c of circlesRef.current) {
        // 포인터와의 거리 계산
        const dx = c.x - px;
        const dy = c.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 포인터 쪽으로 끌려감
        if (dist < pushRadius + c.size / 2 && dist > 0) {
          const force = pushStrength * (1 - dist / (pushRadius + c.size / 2));
          c.vx -= (dx / dist) * force;
          c.vy -= (dy / dist) * force;
        } else {
          // 포인터가 없을 때 천천히 움직임 (속도 1/2)
          c.vx += (Math.random() - 0.5) * 0.1;
          c.vy += (Math.random() - 0.5) * 0.1;
        }

        // 감속 (마찰)
        c.vx *= 0.9;
        c.vy *= 0.9;

        // 미세 속도 제거 (떨림 방지)
        if (Math.abs(c.vx) < 0.05) c.vx = 0;
        if (Math.abs(c.vy) < 0.05) c.vy = 0;
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

        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = c.color;
        ctx.fill();
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

  // PC: 콘텐츠를 한 화면에 맞추고 start(왼쪽 위) 정렬
  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      if (w < PC_BREAKPOINT) {
        setIsPC(false);
        setScale(1);
        return;
      }
      setIsPC(true);
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
    const t = setTimeout(measure, 100);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
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
      className="min-h-screen h-screen bg-white relative overflow-hidden select-none md:h-screen"
      style={{ fontFamily: "Gabarito, sans-serif" }}
    >
      {/* 배경 원형 그래픽 (Canvas) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* 메인 컨텐츠: PC에서는 start 정렬 + 한 화면에 맞춤 */}
      <div
        className="relative z-50 w-full h-full md:overflow-hidden md:flex md:items-start md:justify-start"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          ref={contentRef}
          className="w-full md:absolute md:top-0 md:left-0"
          style={{
            padding: "2vw",
            ...(isPC
              ? {
                  transformOrigin: "top left",
                  transform: `scale(${scale})`,
                }
              : {}),
          }}
        >
        <main className="grid grid-cols-2" style={{ gap: "2vw" }}>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <Text size="large" weight="medium">Dachan Jeong</Text>
          </div>
          <div className="col-span-1 border-b-vw pt-[0.8vw]" style={{ paddingBottom: "2vw" }}>
            <Text size="small" weight="bold">
              Based in<br />South Korea
            </Text>
          </div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}></div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <Link href="https://www.instagram.com/chandajeong/">
            <Text size="large" weight="medium">
              Insta<br />
              <span className="inline-flex items-baseline" style={{ gap: "1vw" }}>
                gram
                <Image src="/link.svg" alt="link" width={38} height={29} className="inline-block align-baseline w-[8vw] h-auto"/>
              </span>
            </Text>
            </Link>
          </div>
          <div className="col-span-2 relative" style={{ paddingBottom: "4vw" }}>
            <Text size="large" weight="medium" withBorder={false}>
              A Graphic 
              <span className="inline-block" style={{ marginLeft: "2vw" }}>
                <Text size="small" weight="bold">
                  Typography<br />Editorial
                </Text>
              </span> 
                <br />design
            </Text>
            <div className="absolute bottom-0 left-0 w-[49%] border-b-vw"></div>
            <div className="absolute bottom-0 right-0 w-[49%] border-b-vw"></div>
          </div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
          </div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <Text size="large" weight="medium">–Based<br /><span className="opacity-0">-</span><br /></Text>
          </div>
          <div className="col-span-2 relative" style={{ paddingBottom: "4vw" }}>
            <Text size="large" weight="medium" withBorder={false}>
              Creative
              <span className="inline-block" style={{ marginLeft: "2vw" }}>
                <Text size="small" weight="bold">
                  Interactive<br />Web
                </Text>
              </span> 
                <br />Coder
            </Text>
            <div className="absolute bottom-0 left-0 w-[49%] border-b-vw"></div>
            <div className="absolute bottom-0 right-0 w-[49%] border-b-vw"></div>
          </div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <Text size="large" weight="medium">Making</Text>
          </div>
          <div className="col-span-1 border-b-vw" style={{ paddingBottom: "2vw" }}>
            <Text size="large" weight="medium">Visual
              <span className="inline-block" style={{ marginLeft: "2vw" }}>
                <Text size="small" weight="bold">
                  2D<br />3D
                </Text>
              </span> 
                Systems
            </Text>
          </div>
          <div className="col-span-1">
            <Text size="large" weight="medium">Through Code.</Text>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
