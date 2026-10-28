// Owns the phone number in Settings: save a 10-digit mobile number, or clear
// the box to remove it. Saves on the button, not on every keystroke, because a
// half-typed number is not a number.
//
// It deliberately promises nothing about the number: it is not verified and
// nothing uses it yet (owner's decision N3), and the copy says exactly that.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { callApi } from "@/components/decks/deckClient";
import { phoneSchema } from "@/lib/accountSchemas";

export function PhoneForm({ initialPhone }: { initialPhone: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = phoneSchema.safeParse({ phone });
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0]?.message ?? "Enter a 10-digit mobile number, or leave it empty." });
    setBusy(true);
    setMsg(null);
    // The route answers PATCH; callApi posts, so this one call is written out.
    const res = await fetch("/api/profile/phone", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) })
      .then(async (r) => {
        let data: { error?: string } = {};
        try {
          data = JSON.parse(await r.text());
        } catch {
          return "Something went wrong. Try again in a moment.";
        }
        return r.ok ? null : (data.error ?? "Could not save. Try again.");
      })
      .catch(() => "No connection. Nothing was saved — try again when you are back online.");
    setBusy(false);
    if (res) return setMsg({ ok: false, text: res });
    setPhone(parsed.data.phone);
    setMsg({ ok: true, text: parsed.data.phone ? "Saved." : "Removed." });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <Label htmlFor="phone-number">Mobile number (optional)</Label>
      <div className="flex gap-2">
        <Input id="phone-number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10 digits" value={phone} onChange={(e) => setPhone(e.target.value)} className="max-w-56" />
        <Button type="submit" size="md" disabled={busy} className="shrink-0">
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="text-xs text-ink-muted">Not verified. It is not used to sign in, and we do not send SMS. Clear the box and save to remove it.</p>
      {msg ? (
        <p aria-live="polite" className={msg.ok ? "text-xs text-success" : "text-xs text-error"}>
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}
