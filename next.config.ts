// Owns Next.js configuration: response headers for the service worker and the
// Android asset-links file, and what is left out of the server function
// bundles Vercel stores for every deployment.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's runtime folder carries WebAssembly engines for every database it
  // supports (CockroachDB, MySQL, SQL Server, SQLite, and Postgres for the edge),
  // each twice, about 53 MB. File tracing copied all of them into every function,
  // and Vercel's Hobby plan caps the stored size of all deployments' functions
  // at 10 GB. This app runs Prisma's native Node engine (the .so.node file),
  // which never loads them. If the generator ever switches to driver adapters
  // or engineType "client", these files are needed again and this must go.
  outputFileTracingExcludes: {
    "/*": [
      "node_modules/@prisma/client/runtime/*.wasm-base64.*",
      "node_modules/.prisma/client/*.wasm",
    ],
  },
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
