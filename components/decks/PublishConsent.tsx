// Owns the form a creator fills in before a deck goes to review: the one-time
// "I am 18 or older", whether it goes out as themselves or under their
// institute's name and logo, how their name shows on public decks, and the
// ticks (own work, licence, EduSarthi's paid use, and permission to publish
// for the institute). Validated with the same schema the server enforces.
//
// It deliberately does NOT decide anything: the server re-checks every tick
// and the age answer (lib/deckReview), and an admin still reviews the deck.

"use client";

import Link from "next/link";
import { useId, useState } from "react";
import type { CreditStyle, Role } from "@prisma/client";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { callApi } from "@/components/decks/deckClient";
import { publishConsentSchema } from "@/lib/deckSchemas";
import { CREDIT_CHOICES, LICENCES, creditPreview } from "@/lib/libraryTerms";

export type ConsentDefaults = {
  role: Role;
  accountName: string | null;
  adultConfirmed: boolean;
  creditStyle: CreditStyle | null;
  publicName: string | null;
};

/// Offered to an institute's admin and teachers. `locked`: the deck is shared
/// with the institute, so it can only go out under the institute's name.
export type PublishAs = { name: string; locked: boolean } | null;

type Props = { deckId: string; defaults: ConsentDefaults; institute?: PublishAs; onCancel: () => void; onDone: () => void };

const tick = "mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]";

export function PublishConsent({ deckId, defaults, institute = null, onCancel, onDone }: Props) {
  const uid = useId();
  const hasName = Boolean(defaults.accountName?.trim());
  const admin = defaults.role === "ADMIN";
  const [adult, setAdult] = useState(defaults.adultConfirmed);
  const [style, setStyle] = useState<CreditStyle>(defaults.creditStyle ?? (hasName ? "FIRST_NAME" : "NONE"));
  const [publicName, setPublicName] = useState(defaults.publicName ?? "");
  const [ownWork, setOwnWork] = useState(false);
  const [licence, setLicence] = useState(false);
  const [paidUse, setPaidUse] = useState(false);
  const [asInstitute, setAsInstitute] = useState(Boolean(institute?.locked));
  const [behalf, setBehalf] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (!adult) return setError("Publishing to the public library is open from age 18. You can still keep this deck private or share it by link.");
    const check = publishConsentSchema.safeParse({ adult, ownWork, licence, paidUse, name: { creditStyle: style, publicName }, asInstitute, behalf: asInstitute && behalf });
    if (!check.success) return setError(check.error.issues[0]?.message ?? "Check the form and try again.");
    setBusy(true);
    const res = await callApi("/api/decks", { action: "publish", id: deckId, consent: check.data });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    onDone();
  }

  const person = creditPreview(style, defaults.accountName, publicName, defaults.role);
  const instName = asInstitute && institute ? institute.name : null;
  // Matches lib/libraryTerms byLine: "no name" leaves only the institute.
  const preview = instName ? (style === "NONE" ? instName : `${instName} (${person})`) : person;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-3">
      <p className="text-sm font-medium text-ink">Before you submit</p>

      {!defaults.adultConfirmed ? (
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className={tick} checked={adult} onChange={(e) => setAdult(e.target.checked)} />
          <span>
            I am 18 or older.
            <span className="block text-xs text-ink-muted">Publishing is open from 18. Under 18? Keep this deck private or share it by link instead.</span>
          </span>
        </label>
      ) : null}

      {institute ? (
        institute.locked ? (
          <p className="text-sm text-ink">This deck is shared with <b>{institute.name}</b>, so it goes to the library under the institute’s name and logo. To publish it as yourself, stop sharing it with the institute first.</p>
        ) : (
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-ink">Publish as</legend>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name={`${uid}-as`} className="accent-[var(--color-accent)]" checked={!asInstitute} onChange={() => setAsInstitute(false)} />
              Myself
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name={`${uid}-as`} className="accent-[var(--color-accent)]" checked={asInstitute} onChange={() => setAsInstitute(true)} />
              {institute.name} (the institute)
            </label>
          </fieldset>
        )
      ) : null}

      {!admin || instName ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-ink">{instName ? "How your name shows beside the institute’s" : "How your name shows on public decks"}</legend>
          {CREDIT_CHOICES.map((c) => {
            const needsName = (c.value === "FULL_NAME" || c.value === "FIRST_NAME") && !hasName;
            return (
              <label key={c.value} className="flex items-center gap-2 text-sm text-ink aria-disabled:text-ink-muted" aria-disabled={needsName || undefined}>
                <input type="radio" name={`${uid}-credit`} className="accent-[var(--color-accent)]" checked={style === c.value} disabled={needsName} onChange={() => setStyle(c.value)} />
                {c.label}
                {needsName ? <span className="text-xs">(add your name on your Profile page first)</span> : null}
              </label>
            );
          })}
          {style === "DISPLAY_NAME" ? (
            <div>
              <Label htmlFor={`${uid}-pn`}>Display name</Label>
              <Input id={`${uid}-pn`} value={publicName} maxLength={40} onChange={(e) => setPublicName(e.target.value)} />
            </div>
          ) : null}
          {preview ? <p className="text-xs text-ink-muted">Shown as: <b className="text-ink">by {preview}</b>. You can change this later in Settings.</p> : null}
        </fieldset>
      ) : null}

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className={tick} checked={ownWork} onChange={(e) => setOwnWork(e.target.checked)} />
          <span>I made this deck, or I have the right to share everything in it.</span>
        </label>
        {instName ? (
          <label className="flex items-start gap-2 text-sm text-ink">
            <input type="checkbox" className={tick} checked={behalf} onChange={(e) => setBehalf(e.target.checked)} />
            <span>
              I may publish this deck on behalf of {instName}, under its name and logo.
              <span className="block text-xs text-ink-muted">The institute’s admin can take its name off the deck at any time; it then stays in the library under your name.</span>
            </span>
          </label>
        ) : null}
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className={tick} checked={licence} onChange={(e) => setLicence(e.target.checked)} />
          {admin && !instName ? (
            <span>It is published as {LICENCES.EDUSARTHI.label}.</span>
          ) : (
            <span>
              Others may share and change it, with credit to {instName ? `${instName} and me` : "me"}, under{" "}
              <a href={LICENCES.CC_BY_SA.href} target="_blank" rel="noopener noreferrer" className="text-accent underline">{LICENCES.CC_BY_SA.label}</a>.
            </span>
          )}
        </label>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" className={tick} checked={paidUse} onChange={(e) => setPaidUse(e.target.checked)} />
          <span>
            EduSarthi may use it in paid features.
            <span className="block text-xs text-ink-muted">EduSarthi plans to reward creators; how is not decided yet.</span>
          </span>
        </label>
      </div>

      <p className="text-xs text-ink-muted">
        An admin checks every deck against the{" "}
        <Link href="/legal/library-rules" target="_blank" className="text-accent underline">library rules</Link> before anyone else can find it.
      </p>

      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => void submit()}>{busy ? "Submitting…" : "Submit for review"}</Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
