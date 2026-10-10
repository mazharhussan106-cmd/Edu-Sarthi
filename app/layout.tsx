// Owns the document shell: fonts, the theme attribute, and the <body> wrapper
// every page renders into. It reads the theme cookie on the server so the
// correct palette is in the HTML before first paint.
//
// It deliberately does NOT render a header or footer. Those differ by role and
// belong to the route group layouts — a shared one here would mean every page
// hiding pieces it does not want.

import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";

import { ServiceWorker } from "@/components/layout/ServiceWorker";
import { attrFromCookie, THEME_COOKIE } from "@/lib/theme";
import { TEXT_SIZE_COOKIE, textAttrFromCookie } from "@/lib/textSize";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduSarthi — Spoken English, audited by a teacher",
  description:
    "Record your spoken English, get a rubric-scored audit with timestamped notes from a real teacher.",
  appleWebApp: { capable: true, title: "EduSarthi", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/apple-touch-icon.png" },
};

// viewport-fit=cover lets the bottom navigation sit above the phone's gesture
// bar using env(safe-area-inset-bottom). The theme colour is the Light
// theme's ink — a literal, because the browser reads it before any CSS.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b1f24",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Reading a cookie opts the whole tree out of static rendering. That is the
  // intended trade — nearly every page is user-specific anyway, and the
  // alternative is a visible flash of the wrong theme on every load.
  const cookieStore = await cookies();
  const theme = attrFromCookie(cookieStore.get(THEME_COOKIE)?.value);
  const textSize = textAttrFromCookie(cookieStore.get(TEXT_SIZE_COOKIE)?.value);

  return (
    <html
      lang="en"
      data-theme={theme}
      data-text={textSize}
      className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      {/* Browser extensions — Grammarly especially — inject attributes into
          <body> before React hydrates, which React reports as a mismatch.
          Suppression is scoped to this one element, not the whole tree. */}
      <body suppressHydrationWarning>
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
