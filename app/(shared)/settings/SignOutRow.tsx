// Owns the "Sign out" row at the end of Settings → Account & security. The
// header's settings button now opens this page instead of a dropdown, and
// that dropdown held Sign out, so it moves here as well as staying in the menu.
//
// It asks first, in its sheet, because for a guest signing out is final: a
// guest account has no email or password to come back with.

"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { SheetRow } from "@/components/ui/SheetRow";

export function SignOutRow({ guest }: { guest: boolean }) {
  const [busy, setBusy] = useState(false);

  return (
    <SheetRow title="Sign out" subline={guest ? "This ends the guest account for good." : "Sign out on this device."}>
      <p className="text-sm text-ink-muted">
        {guest
          ? "A guest account has no email or password, so once you sign out it cannot be opened again, and nor can its cards. To keep them, add your email under Keep your progress first."
          : "You can sign in again any time, the same way as before. Your cards and recordings stay."}
      </p>
      <Button
        variant="outline"
        className="mt-4 w-full"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void signOut({ callbackUrl: "/" });
        }}
      >
        {busy ? "Signing out…" : guest ? "Sign out and end this guest account" : "Sign out"}
      </Button>
    </SheetRow>
  );
}
