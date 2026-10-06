// Owns "what is this site's public address" for links we put in emails (reset
// links, one-tap sign-in). It uses NEXT_PUBLIC_APP_URL, and in production it
// THROWS if that is missing rather than guessing: the request's Host header can
// be influenced by the caller, so a link built from it could point a victim's
// sign-in token at an attacker's site, and a localhost fallback gives real
// users a dead link.
//
// Outside production it falls back to the request origin or localhost, so a
// laptop works with no setup. It deliberately knows nothing else about email.

export function appUrl(req?: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is missing — refusing to build an email link from the request");
  }
  return req ? new URL(req.url).origin : "http://localhost:3000";
}
