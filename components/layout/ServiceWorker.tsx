// Owns registering the service worker (public/sw.js), which serves the offline
// page in the installed app.
//
// Production only. In development a service worker survives code changes and
// serves stale pages, which reads as "my edit did nothing".

"use client";

import { useEffect } from "react";

export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Not fatal: the site works without it, only the offline page is lost.
      });
  }, []);
  return null;
}
