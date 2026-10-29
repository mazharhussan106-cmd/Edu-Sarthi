// Owns "what address do search engines and social previews see": the base for
// canonical links, robots.txt and the sitemap. NEXT_PUBLIC_APP_URL wins; on
// Vercel the project's production domain is the fallback; elsewhere localhost.
//
// It deliberately returns null instead of throwing when production has neither.
// lib/appUrl throws, because a wrong host in an email link is a security hole;
// here a throw would fail `next build` and block every deploy over a missing
// variable, and the worst case of leaving the link out is a page with no
// canonical tag. It also never reads the request's Host header, which the
// caller controls.

export function siteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");
  // Set by Vercel itself: a bare host such as "edu-sarthi-nine.vercel.app".
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
}

/// `alternates` for a page's metadata, or nothing when there is no base: Next
/// refuses a relative canonical without a metadataBase, and a canonical that
/// points at the wrong host does more harm than none.
export function canonical(path: string): { alternates?: { canonical: string } } {
  return siteUrl() ? { alternates: { canonical: path } } : {};
}
