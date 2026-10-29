// Owns robots.txt: what a search engine may crawl and where the sitemap is.
//
// It deliberately does NOT disallow /d/ (link-shared decks). Those pages say
// `noindex` in their own tag, and a crawler that is forbidden to fetch a page
// never sees that tag; it may still list the bare address if another site
// links to it. The signed-in areas below are listed only to save crawling
// pages that redirect to /login: the real gate is proxy.ts, not this file.

import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/siteUrl";

const SIGNED_IN_AREAS = [
  "/api/",
  "/dashboard",
  "/flashcards",
  "/feedback",
  "/class",
  "/profile",
  "/settings",
  "/decks",
  "/explore",
  "/my-cards",
  "/today",
  "/notices",
  "/history",
  "/progress",
  "/search",
  "/modules",
  "/practice",
  "/help",
  "/institute",
  "/verify",
  "/queue",
  "/review",
  "/students",
  "/workload",
  "/admin",
  // Under the public /library but for signed-in learners only.
  "/library/*/study",
  "/library/*/practice/",
];

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: SIGNED_IN_AREAS },
    // Left out when the address is unknown, rather than pointing at a guess.
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
