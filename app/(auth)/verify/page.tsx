// Owns the six-digit code entry and the resend button.
//
// After a successful check it calls NextAuth's update() before navigating.
// Without that the JWT still says unverified, middleware sees an unverified
// user on /dashboard, and bounces them straight back here — a redirect loop
// that looks like the code was rejected.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { verifyCodeSchema } from "@/lib/validations";

export default function VerifyPage() {
  const router = useRouter();
  const { data: session, update } = useSession();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Mirrors the server's 60s resend window so the button is visibly disabled
  // instead of failing with a 429 the user has to read.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function post(body: object) {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, data: { error: "Something went wrong. Please try again." } };
    }

    return { ok: res.ok, data };
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const parsed = verifyCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code.");
      return;
    }

    setBusy(true);
    const { ok, data } = await post({ action: "verify", code: parsed.data.code });

    if (!ok) {
      setError((data.error as string) ?? "That code is not right.");
      setBusy(false);
      return;
    }

    // Refreshes the token in place. The value comes from the server response,
    // not from a guess about what it should now be.
    await update({ emailVerified: data.emailVerified });

    const role = data.role;
    router.push(role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/queue" : "/dashboard");
    router.refresh();
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    setBusy(true);

    const { ok, data } = await post({ action: "resend" });

    if (!ok) {
      setError((data.error as string) ?? "Could not send a new code.");
    } else {
      setNotice("A new code is on its way.");
      setCooldown(60);
    }

    setBusy(false);
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Check your email
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        We sent a 6-digit code to{" "}
        <span className="text-ink">{session?.user?.email ?? "your inbox"}</span>.
        It expires in 10 minutes.
      </p>

      <form onSubmit={handleVerify} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            // numeric, not number: a number input strips leading zeros, and a
            // code like 004821 becomes 4821.
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            aria-invalid={error ? true : undefined}
            className="font-mono tracking-[0.4em]"
            required
          />
        </div>

        {error ? (
          <p role="alert" aria-live="assertive" className="text-xs text-error">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p aria-live="polite" className="text-xs text-success">
            {notice}
          </p>
        ) : null}

        <Button type="submit" disabled={busy || code.length !== 6}>
          {busy ? "Checking…" : "Verify email"}
        </Button>
      </form>

      <div className="mt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={busy || cooldown > 0}
        >
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
        </Button>
      </div>
    </div>
  );
}
