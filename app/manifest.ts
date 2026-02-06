import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "dachanjeong.xyz",
    short_name: "dachanjeong.xyz",
    description: "dachanjeong.xyz",
    start_url: "/",
    display: "standalone",
    orientation: "portrait", // 세로 모드만 허용
    theme_color: "#ffffff",
    background_color: "#ffffff",
  };
}
