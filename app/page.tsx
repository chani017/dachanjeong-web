"use client";

import Image from "next/image";
import Text from "./components/Text";
import BgCircles from "./components/BgCircles";
import { useRef } from "react";
import Link from "next/link";
import { useContentScale } from "./hooks/useContentScale";
import { useDeviceInfo } from "./hooks/useDeviceInfo";
import { useOrientationLock } from "./hooks/useOrientationLock";
import { useDoubleTapRefresh } from "./hooks/useDoubleTapRefresh";
import { useTextTiltTouch } from "./hooks/useTextTiltTouch";


export default function Home() {
  const contentRef = useRef<HTMLDivElement>(null);
  const scale = useContentScale(contentRef);
  const { isMobile, isLandscape } = useDeviceInfo();

  useOrientationLock();
  useDoubleTapRefresh();
  useTextTiltTouch();

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
