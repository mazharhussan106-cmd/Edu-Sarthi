// Owns the shell for pages a signed-out visitor can read: about, support and
// the legal pages. The header is shared with the signed-out library pages
// (components/layout/PublicHeader).

import { Footer } from "@/components/layout/Footer";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />

      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
