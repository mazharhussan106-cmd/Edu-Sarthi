// Owns the one check every cron route makes: is this Vercel's scheduler?
// Vercel sends "Authorization: Bearer <CRON_SECRET>". Without it a route
// refuses, because an open cron endpoint is a way for anyone to make the site
// email its users.
//
// It deliberately refuses everything when CRON_SECRET is not set, rather than
// letting everything through.

import { timingSafeEqual } from "node:crypto";

export function cronAuthorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(`Bearer ${secret}`);
  // timingSafeEqual throws on unequal lengths, so length is compared first.
  return a.length === b.length && timingSafeEqual(a, b);
}
