import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} — Used cars`,
    short_name: brand.name,
    description: brand.tagline,
    start_url: "/?source=pwa",
    display: "standalone",
    background_color: "#0b1222",
    theme_color: "#0b1222",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search cars", url: "/used-cars" },
      { name: "Saved vehicles", url: "/saved" },
    ],
  };
}
