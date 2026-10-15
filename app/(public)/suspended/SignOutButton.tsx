// Owns the sign-out button on the suspended page. A client component only
// because next-auth's signOut runs in the browser.
//
// With `auto` it signs out on arrival. A session ended by "Sign out of all
// devices" would otherwise leave a stale cookie that the proxy still treats as
// signed in, bouncing /login back here until the button is found and pressed.

"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

export function SignOutButton({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (auto) void signOut({ callbackUrl: "/login" });
  }, [auto]);

  return (
    <Button variant="outline" onClick={() => void signOut({ callbackUrl: "/" })}>
      Sign out
    </Button>
  );
}
