import type { Metadata, Viewport } from "next";
import { Gabarito } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const gabarito = Gabarito({
  variable: "--font-gabarito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "dachanjeong.xyz",
  description: "dachanjeong.xyz",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // "default" | "black" | "black-translucent"
  },
  other: {
    "apple-mobile-web-app-status-bar-style": "default", // "default" | "black" | "black-translucent"
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Gabarito:wght@400..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${gabarito.variable} antialiased`}
        style={{ fontFamily: "Gabarito, sans-serif" }}
      >
        {children}
        <Analytics />
      </body>
      <Analytics />
    </html>
  );
}
