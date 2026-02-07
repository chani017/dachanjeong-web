"use client";

import { useEffect, useRef, useCallback } from "react";

interface Circle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  phase: number;
}

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

const COLOR_PALETTE = ["#0066ff", "#ff0022", "#ffc000"] as const;
const COLOR_STOPS_CACHE: Record<string, Record<number, string>> = {};
function getColorStop(hex: string, amount: number): string {
  if (!COLOR_STOPS_CACHE[hex]) {
    COLOR_STOPS_CACHE[hex] = {};
  }
  if (!COLOR_STOPS_CACHE[hex][amount]) {
    COLOR_STOPS_CACHE[hex][amount] = lightenHex(hex, amount);
  }
  return COLOR_STOPS_CACHE[hex][amount];
}

export default function BackgroundCircles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circlesRef = useRef<Circle[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);

  const initCircles = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const circles: Circle[] = [];

    const getRandomColor = () =>
      COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];

    const MIN_SIZE = 80;
    const MAX_SIZE = 280;
    const MAX_SIZE_THRESHOLD = 270;
    const MAX_LARGE_COUNT = 2;

    const mobile = isMobileDevice();
    const circleCount = mobile ? 10 : 36;

    const sizes: number[] = [];
    if (mobile) {
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

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const resize = () => {
      const dpr = window.devicePixelRatio || 2;
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
    const debouncedResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeTimeout = null;
        resize();
        initCircles();
      }, 150);
    };
    resize();
    initCircles();

    const isMobile = isMobileDevice();
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

    window.addEventListener("resize", debouncedResize);

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
          const waveX = Math.sin(time * 1.1 + c.phase) * 0.08 + Math.sin(time * 0.7 + c.phase * 1.5) * 0.04;
          const waveY = Math.cos(time * 0.9 + c.phase * 1.2) * 0.08 + Math.cos(time * 0.6 + c.phase * 0.8) * 0.04;
          c.vx += waveX + (Math.random() - 0.5) * 0.06;
          c.vy += waveY + (Math.random() - 0.5) * 0.06;
        }

        c.vx *= 0.9;
        c.vy *= 0.9;

        if (Math.abs(c.vx) < 0.02) c.vx *= 0.5;
        if (Math.abs(c.vy) < 0.02) c.vy *= 0.5;
      }

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

              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
              b.x += nx * overlap * 0.5;
              b.y += ny * overlap * 0.5;
            }
          }
        }
      }

      const cw = logicalW;
      const ch = logicalH;
      for (const c of circles) {
        c.x += c.vx;
        c.y += c.vy;

        const r = c.size / 2;
        if (c.x < r) { c.x = r; c.vx = 0; }
        if (c.x > cw - r) { c.x = cw - r; c.vx = 0; }
        if (c.y < r) { c.y = r; c.vy = 0; }
        if (c.y > ch - r) { c.y = ch - r; c.vy = 0; }

        const lightOffset = r * 0.65;
        const gx = c.x - lightOffset;
        const gy = c.y - lightOffset;
        const grad = ctx.createRadialGradient(gx, gy, 0, c.x, c.y, r);
        grad.addColorStop(0, getColorStop(c.color, 85));
        grad.addColorStop(0, c.color);
        grad.addColorStop(0.85, getColorStop(c.color, 55));
        grad.addColorStop(1, getColorStop(c.color, 90));
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (grainCtx && !isMobile) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
          ctx.clip();
          ctx.globalCompositeOperation = "multiply";
          ctx.globalAlpha = 0.1;
          ctx.drawImage(grainCanvas, 0, 0, GRAIN_SIZE, GRAIN_SIZE, c.x - r, c.y - r, r * 4, r * 4);
          ctx.restore();
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onPointerLeave);
      window.removeEventListener("touchend", onPointerLeave);
    };
  }, [initCircles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
