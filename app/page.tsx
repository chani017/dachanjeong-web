"use client";

import Image from "next/image";
import Text from "./components/Text";
import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";

interface Circle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circlesRef = useRef<Circle[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const animRef = useRef<number>(0);

  const initCircles = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const circles: Circle[] = [];
    
    // 지정된 색상 팔레트에서 랜덤 선택
    const colorPalette = ["#0a66dd", "#ff3300", "#ffca00" ];
    const getRandomColor = () => {
      return colorPalette[Math.floor(Math.random() * colorPalette.length)];
    };
    
    // PC면 원의 개수를 4배로 (768px 이상)
    const isPC = w >= 768;
    const circleCount = isPC ? 48 : 12;
    
    for (let i = 0; i < circleCount; i++) {
      const size = Math.random() * 150 + 100;
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

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: px, y: py } = pointerRef.current;
      const pushRadius = 150;
      const pushStrength = 5;

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
          // 포인터가 없을 때 천천히 움직임 (작은 랜덤 속도 추가)
          c.vx += (Math.random() - 0.5) * 0.2;
          c.vy += (Math.random() - 0.5) * 0.2;
        }

        // 감속 (마찰)
        c.vx *= 0.99;
        c.vy *= 0.99;

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

      // 위치 업데이트, 경계 처리, 그리기
      const cw = canvas.width;
      const ch = canvas.height;
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

  return (
    <div className="min-h-screen bg-white relative overflow-hidden h-screen select-none" style={{ fontFamily: "Gabarito, sans-serif" }}>
      {/* 배경 원형 그래픽 (Canvas) */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* 메인 컨텐츠 */}
      <div
        className="relative z-50 w-full px-2 py-2 md:max-w-1/4"
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <main className="grid grid-cols-2 gap-2">
          <div className="col-span-1 border-b-6 border-black pb-2">
            <Text size="large" weight="medium">Dachan Jeong</Text>
          </div>
          <div className="col-span-1 border-b-6 border-black pb-2">
            <Text size="small" weight="bold">
              Based in<br />South Korea
            </Text>
          </div>
          <div className="col-span-1 border-b-6 border-black pb-2"></div>
          <div className="col-span-1 border-b-6 border-black pb-2">
            <Link href="https://www.instagram.com/chandajeong/">
            <Text size="large" weight="medium">
              Insta<br />
              <span className="inline-flex items-baseline gap-1">
                gram
                <Image src="/link.svg" alt="link" width={38} height={29} className="inline-block align-baseline" style={{ marginLeft: "0.1em" }} />
              </span>
            </Text>
            </Link>
          </div>
          <div className="col-span-2 pb-4 relative">
            <Text size="large" weight="medium" withBorder={false}>
              A Graphic 
              <Text size="small" weight="bold" className="inline-block ml-2">
                Typography<br />Editorial
                </Text> 
                <br />design
            </Text>
            <div className="absolute bottom-0 left-0 w-[49%] border-b-6 border-black"></div>
            <div className="absolute bottom-0 right-0 w-[49%] border-b-6 border-black"></div>
          </div>
          <div className="col-span-1 border-b-6 border-black pb-2">
          </div>
          <div className="col-span-1 border-b-6 border-black pb-2">
            <Text size="large" weight="medium">–Based<br /><span className="opacity-0">-</span><br /></Text>
          </div>
          <div className="col-span-2 pb-4 relative">
            <Text size="large" weight="medium" withBorder={false}>
              Creative
              <Text size="small" weight="bold" className="inline-block ml-2">
                Interactive<br />Web
                </Text> 
                <br />Coder
            </Text>
            <div className="absolute bottom-0 left-0 w-[49%] border-b-6 border-black"></div>
            <div className="absolute bottom-0 right-0 w-[49%] border-b-6 border-black"></div>
          </div>
          <div className="col-span-1 border-b-6 border-black pb-2">
            <Text size="large" weight="medium">Making</Text>
          </div>
          <div className="col-span-1 border-b-6 border-black pb-2">
            <Text size="large" weight="medium">Visual
              <Text size="small" weight="bold" className="inline-block ml-2">
                2D,<br />3D
                </Text> 
                Systems
            </Text>
          </div>
          <div className="col-span-1">
            <Text size="large" weight="medium">Through Code.</Text>
          </div>
        </main>
      </div>
    </div>
  );
}
