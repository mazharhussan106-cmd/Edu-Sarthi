// Owns the sign-in form. Client component throughout: it holds field state and
// calls signIn from the browser.
//
// It deliberately does NOT decide where to send the user. That comes from the
// session after sign-in, so the rule lives in one place rather than being
// duplicated between here and middleware.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { loginSchema } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Same schema the server enforces. This only saves a round trip — the
    // server never trusts that this ran.
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details.");
      return;
    }

    setBusy(true);

    const result = await signIn("credentials", {
      ...parsed.data,
      redirect: false,
    });

    if (result?.error) {
      // Identical wording for a wrong email and a wrong password. Telling
      // them apart would confirm which addresses have accounts.
      setError(
        result.code === "throttled"
          ? "Too many attempts. Wait a few minutes and try again."
          : "Email or password is not correct.",
      );
      setBusy(false);
      return;
    }

    // Read the session rather than guessing: the role decides the landing
    // page, and the JWT is the only thing that knows it.
    const session = await getSession();
    const role = session?.user?.role;

    if (!session?.user?.emailVerified) {
      router.push("/verify");
    } else {
      router.push(role === "TEACHER" || role === "ADMIN" ? "/queue" : "/dashboard");
    }

    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Continue to your practice and feedback.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            required
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? (
          // assertive: the user has just pressed a button and is waiting on
          // the result, so interrupting is the correct behaviour here.
          <p role="alert" aria-live="assertive" className="text-xs text-error">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-xs text-ink-muted">
        <Link href="/forgot-password" className="hover:text-accent">
          Forgot your password?
        </Link>
        <p>
          New here?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
