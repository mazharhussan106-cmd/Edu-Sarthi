// Owns the "Recordings per student per day" control on Admin → Settings.
//
// A number box with Save, not save-on-change: this changes every student's
// allowance at once, so it waits for a deliberate press. It deliberately
// says nothing about who changed it; the admin log keeps that.

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { adminPost } from "@/components/admin/adminPost";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { AUDITS_PER_DAY_MAX, AUDITS_PER_DAY_MIN, auditsPerDaySchema } from "@/lib/appSettingSchemas";

export function SiteSettingsForm({ auditsPerDay }: { auditsPerDay: number }) {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState(String(auditsPerDay));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = auditsPerDaySchema.safeParse({ auditsPerDay: Number(value) });
    if (!parsed.success) return setMsg({ ok: false, text: parsed.error.issues[0]?.message ?? "Enter a whole number." });
    setBusy(true);
    setMsg(null);
    const r = await adminPost("/api/admin/settings", parsed.data);
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setMsg({ ok: true, text: `Saved. Students can now send ${parsed.data.auditsPerDay} a day.` });
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void save(e)} className="flex flex-col gap-2">
      <Label htmlFor={id}>Recordings per student per day</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={AUDITS_PER_DAY_MIN}
          max={AUDITS_PER_DAY_MAX}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={`${id}-note`}
          className="max-w-24"
        />
        <Button type="submit" disabled={busy} className="shrink-0">{busy ? "Saving…" : "Save"}</Button>
      </div>
      <p id={`${id}-note`} className="text-xs text-ink-muted">
        {AUDITS_PER_DAY_MIN} to {AUDITS_PER_DAY_MAX}. Counted per India day. A new recording a teacher asked for after sending one back
        does not count. Takes effect at once, including for today.
      </p>
      {msg ? <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-xs text-success" : "text-xs text-error"}>{msg.text}</p> : null}
    </form>
  );
}
