// Owns the owner's "People" section on a deck: invite someone by email to view
// or edit it, see who is invited and who has accepted, change a role (invite
// the same address again) and remove someone.
//
// It deliberately does NOT say whether an email has an account: every invite
// reads "invited" until the person accepts. Limits and rules are the
// server's (lib/deckMembers).

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { callApi } from "@/components/decks/deckClient";
import { DECK_LIMITS } from "@/lib/deckSchemas";

export type PersonRow = { id: string; email: string; role: "VIEW" | "EDIT"; accepted: boolean; termsAccepted: boolean };

export function DeckPeople({ deckId, people, isPublic }: { deckId: string; people: PersonRow[]; isPublic: boolean }) {
  const uid = useId();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"VIEW" | "EDIT">("VIEW");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function invite() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await callApi("/api/decks/members", { action: "invite", deckId, email, role });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setNotice(`Invited ${email.trim().toLowerCase()}. They will see it in My decks when they sign in with that email.`);
    setEmail("");
    router.refresh();
  }

  async function remove(id: string, who: string) {
    if (!window.confirm(`Stop sharing this deck with ${who}? Cards they added stay in the deck.`)) return;
    const res = await callApi("/api/decks/members", { action: "remove", memberId: id });
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-muted">
        Share this deck with up to {DECK_LIMITS.membersPerDeck} people by email. <b className="text-ink">View</b> lets them read, study and copy it; <b className="text-ink">Edit</b> also lets them change its cards. Only you can publish, share by link, delete it or change who is here.
      </p>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end">
        <div>
          <Label htmlFor={`${uid}-e`}>Email address</Label>
          <Input id={`${uid}-e`} type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor={`${uid}-r`}>Can</Label>
          <select id={`${uid}-r`} value={role} onChange={(e) => setRole(e.target.value as "VIEW" | "EDIT")} className="h-10 w-full rounded-lg border border-border-strong bg-surface px-2 text-sm text-ink">
            <option value="VIEW">View</option>
            <option value="EDIT">Edit</option>
          </select>
        </div>
        <Button disabled={busy || !email.trim()} onClick={() => void invite()}>{busy ? "Inviting…" : "Invite"}</Button>
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {notice ? <p role="status" className="text-sm text-success">{notice}</p> : null}
      {people.length ? (
        <ul className="flex flex-col divide-y divide-border">
          {people.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">{p.email}</span>
                <span className="flex flex-wrap gap-1.5">
                  <Badge>{p.role === "EDIT" ? "can edit" : "can view"}</Badge>
                  {p.accepted ? null : <Badge variant="accent">invited</Badge>}
                  {p.accepted && p.role === "EDIT" && isPublic && !p.termsAccepted ? <Badge variant="error">has not accepted the library terms</Badge> : null}
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => void remove(p.id, p.email)}>Remove</Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
