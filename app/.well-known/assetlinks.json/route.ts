// Owns /.well-known/assetlinks.json — the Digital Asset Links file that proves
// to Android that the EduSarthi app and this website belong together. With it,
// the app opens full screen with no browser bar, and sign-in links from email
// open in the app.
//
// It reads the package name and signing-certificate fingerprints from
// environment variables rather than hardcoding them, because the fingerprint
// Google Play signs with is only known after the app is uploaded, and debug
// builds have a different one.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME;
  const fingerprints = (process.env.ANDROID_CERT_SHA256 ?? "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));

  // An empty list is valid JSON that verifies nothing: the app still runs,
  // just with a browser bar, until the variables are set.
  const body =
    packageName && fingerprints.length > 0
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: packageName,
              sha256_cert_fingerprints: fingerprints,
            },
          },
        ]
      : [];

  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
