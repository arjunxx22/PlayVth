import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlayVth – Book venues, join games", short_name: "PlayVth",
    description: "Book badminton courts, football turfs and more near you. Join games with players of your level.",
    start_url: "/", display: "standalone", background_color: "#0f172a", theme_color: "#0f172a",
    icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
  };
}
