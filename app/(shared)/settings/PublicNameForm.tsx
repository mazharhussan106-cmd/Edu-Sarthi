// Owns "How your name shows on public decks" on the settings page. A choice
// saves the moment it is made, like the rest of Settings; a typed display
// name saves when the person leaves the box or presses Enter.
//
// It deliberately does NOT touch the account name (Profile does) or any deck:
// every public deck reads the credit from the account, so one save updates
// them all.

"use client";

import { useId, useState } from "react";
import type { CreditStyle } from "@prisma/client";

import { Input, Label } from "@/components/ui/Input";
import { publicNameSchema } from "@/lib/deckSchemas";
import { CREDIT_CHOICES, creditPreview } from "@/lib/libraryTerms";

type Props = { accountName: string | null; initialStyle: CreditStyle | null; initialPublicName: string | null; teacher: boolean };

async function save(body: { creditStyle: CreditStyle; publicName: string }): Promise<string | null> {
  try {
    const res = await fetch("/api/profile/public-name", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      return "Something went wrong. Try again in a moment.";
    }
    return res.ok ? null : (data.error ?? "Could not save. Try again.");
  } catch {
    return "No connection. Nothing was saved — try again when you are back online.";
  }
}

export function PublicNameForm({ accountName, initialStyle, initialPublicName, teacher }: Props) {
  const uid = useId();
  const hasName = Boolean(accountName?.trim());
  const [style, setStyle] = useState<CreditStyle | null>(initialStyle);
  const [publicName, setPublicName] = useState(initialPublicName ?? "");
  const [savedName, setSavedName] = useState(initialPublicName ?? "");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function commit(next: CreditStyle, name: string) {
    const check = publicNameSchema.safeParse({ creditStyle: next, publicName: name });
    if (!check.success) return setStatus({ ok: false, text: check.error.issues[0]?.message ?? "Check the display name." });
    setStatus(null);
    const error = await save(check.data);
    if (error) return setStatus({ ok: false, text: error });
    if (next === "DISPLAY_NAME") setSavedName(name.trim());
    setStatus({ ok: true, text: "Saved" });
  }

  function choose(next: CreditStyle) {
    setStyle(next);
    // A display name with nothing typed yet waits for the box, or the save
    // would only fail with "type a display name".
    if (next !== "DISPLAY_NAME" || publicName.trim()) void commit(next, publicName);
  }

  const preview = style ? creditPreview(style, accountName, publicName, teacher ? "TEACHER" : "STUDENT") : "";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-muted">Used only on decks you publish to the library. Nothing is public until an admin approves a deck.</p>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">How your name shows on public decks</legend>
        {CREDIT_CHOICES.map((c) => {
          const needsName = (c.value === "FULL_NAME" || c.value === "FIRST_NAME") && !hasName;
          return (
            <label key={c.value} className="flex items-center gap-2 text-sm text-ink aria-disabled:text-ink-muted" aria-disabled={needsName || undefined}>
              <input type="radio" name={`${uid}-credit`} className="accent-[var(--color-accent)]" checked={style === c.value} disabled={needsName} onChange={() => choose(c.value)} />
              {c.label}
              {needsName ? <span className="text-xs">(add your name on your Profile page first)</span> : null}
            </label>
          );
        })}
      </fieldset>
      {style === "DISPLAY_NAME" ? (
        <div>
          <Label htmlFor={`${uid}-pn`}>Display name</Label>
          <Input
            id={`${uid}-pn`}
            value={publicName}
            maxLength={40}
            onChange={(e) => setPublicName(e.target.value)}
            onBlur={() => { if (publicName.trim() !== savedName) void commit("DISPLAY_NAME", publicName); }}
            onKeyDown={(e) => { if (e.key === "Enter") void commit("DISPLAY_NAME", publicName); }}
          />
        </div>
      ) : null}
      {preview ? <p className="text-xs text-ink-muted">Shown as: <b className="text-ink">by {preview}</b></p> : <p className="text-xs text-ink-muted">Not chosen yet. You will be asked when you first submit a deck.</p>}
      {status ? <p role={status.ok ? "status" : "alert"} className={status.ok ? "text-xs text-success" : "text-xs text-error"}>{status.text}</p> : null}
    </div>
  );
}
