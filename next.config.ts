// Owns Next.js configuration. Today that is only response headers for the
// service worker and the Android asset-links file.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Site-wide. frame-ancestors stops the admin and review pages being
        // framed by another site (clickjacking); the microphone and camera stay
        // available to this site for recording. A full Content-Security-Policy
        // is left for later: the video embeds and the recorder need one written
        // for them, not guessed.
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "microphone=(self), camera=(self), geolocation=()" },
        ],
      },
      {
        // Never cached: a stale service worker keeps serving the old offline
        // behaviour to every installed copy until it happens to expire.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
