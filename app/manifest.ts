// Owns the web app manifest: the name, icons and launch URL that make the
// student app installable, and that the Android wrapper (a Trusted Web
// Activity) is built from.
//
// Colours here are literal hex values, not tokens. The manifest is read by the
// operating system before any CSS loads, so there is no stylesheet for a token
// to resolve against. They match the Light theme's ink and paper.

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "EduSarthi — Spoken English practice",
    short_name: "EduSarthi",
    description:
      "Record your spoken English and get a scored audit with timestamped notes from a real teacher.",
    // The student home. Signed-out users are sent on to /login by middleware.
    start_url: "/dashboard?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf8f5",
    theme_color: "#1b1f24",
    lang: "en-IN",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
