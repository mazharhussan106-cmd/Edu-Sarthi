// Owns the sign-out button on the suspended page. A client component only
// because next-auth's signOut runs in the browser.

"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <Button variant="outline" onClick={() => void signOut({ callbackUrl: "/" })}>
      Sign out
    </Button>
  );
}
