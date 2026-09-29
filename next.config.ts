// Owns Next.js configuration. Today that is only response headers for the
// service worker and the Android asset-links file.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
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
