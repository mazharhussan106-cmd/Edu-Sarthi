// Owns sitemap.xml: the public pages and every deck in the library.
//
// Read per request, not at build time: a deck that is approved, withdrawn or
// taken down must appear or leave at once, and `next build` must not need the
// database. It deliberately lists no card pages (they are `noindex`) and no
// filtered or sorted library lists. If the database is down this throws, so a
// crawler gets an error and retries instead of treating a short list as the
// truth.

import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { LISTED } from "@/lib/decks";
import { siteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

// The sitemap format allows 50,000 URLs in one file. Past about this many
// decks, split it with generateSitemaps.
const MAX_DECKS = 45_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  // No known address means no absolute URLs to give.
  if (!base) return [];

  const decks = await prisma.deck.findMany({
    where: LISTED,
    orderBy: { updatedAt: "desc" },
    take: MAX_DECKS,
    select: { id: true, updatedAt: true },
  });

  return [
    { url: `${base}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/library`, changeFrequency: "daily", priority: 0.9 },
    ...decks.map((d) => ({
      url: `${base}/library/${d.id}`,
      lastModified: d.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/support`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/library-rules`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/legal/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
