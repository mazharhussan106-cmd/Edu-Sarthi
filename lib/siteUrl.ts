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
  // A value that is not a web address ("edusarthi.com" with no https://, only
  // spaces) counts as unset. The root layout turns this into a URL for every
  // page, so a typo in the Vercel variable would otherwise take the whole site
  // down with "Invalid URL" instead of just losing a canonical tag.
  const configured = webAddress(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;
  // Set by Vercel itself: a bare host such as "edu-sarthi-nine.vercel.app".
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const fromVercel = vercel ? webAddress(`https://${vercel.trim()}`) : null;
  if (fromVercel) return fromVercel;
  return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
}

/// The address with no trailing slash, query or fragment, or null when it is
/// not an http(s) address.
function webAddress(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
  } catch {
    return null;
  }
}

/// `alternates` for a page's metadata, or nothing when there is no base: Next
/// refuses a relative canonical without a metadataBase, and a canonical that
/// points at the wrong host does more harm than none.
export function canonical(path: string): { alternates?: { canonical: string } } {
  return siteUrl() ? { alternates: { canonical: path } } : {};
}
