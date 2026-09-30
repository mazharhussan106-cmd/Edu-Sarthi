// Owns the sign-up form, then signs the new user in and sends them to /verify.
//
// It deliberately has no role selector. The route handler ignores role
// entirely, so offering the choice here would be a control that does nothing.
// Teachers are created by changing the row in Supabase.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { registerSchema } from "@/lib/validations";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Shown live, but only once the field has content — flagging a mismatch
  // against an empty box is telling the user off for not having typed yet.
  const mismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details.");
      return;
    }

    setBusy(true);

    let res: Response;
    try {
      res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setBusy(false);
      return;
    }

    // text() then JSON.parse, never a bare res.json(). A serverless timeout
    // returns an HTML error page, and res.json() on that throws "Unexpected
    // end of JSON input", which tells the user nothing.
    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      setError("Something went wrong. Please try again in a moment.");
      setBusy(false);
      return;
    }

    if (!res.ok) {
      setError(data.error ?? "Could not create the account. Please try again.");
      setBusy(false);
      return;
    }

    // Signed in immediately so /verify has a session to verify against.
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    router.push("/verify");
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Submit recordings and get a teacher&apos;s audit on each one.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Mobile number (optional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10 digits"
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => set("password")(e.target.value)}
          showStrength
          required
        />

        <div>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword")(e.target.value)}
            aria-invalid={mismatch || undefined}
            required
          />
          {mismatch ? (
            <p aria-live="polite" className="mt-1 text-xs text-error">
              Passwords do not match
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" aria-live="assertive" className="text-xs text-error">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-xs text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
