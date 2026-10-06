// Owns the deck's name, description and tags form — used to create a deck and
// to edit one. Validates with the same Zod schema the API enforces.
//
// It deliberately does NOT handle sharing or deleting (DeckActions) or cards
// (CardEditor).

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { callApi } from "@/components/decks/deckClient";
import { deckActionSchema, parseTags } from "@/lib/deckSchemas";

type Deck = { id: string; title: string; description: string | null; tags: string[] };

export function DeckForm({ deck }: { deck?: Deck }) {
  const router = useRouter();
  const uid = useId();
  const [title, setTitle] = useState(deck?.title ?? "");
  const [description, setDescription] = useState(deck?.description ?? "");
  const [tags, setTags] = useState(deck?.tags.join(", ") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const body = { action: deck ? "update" : "create", ...(deck ? { id: deck.id } : {}), title, description, tags: parseTags(tags) };
    const check = deckActionSchema.safeParse(body);
    if (!check.success) return setError(check.error.issues[0]?.message ?? "Check the fields and try again.");

    setBusy(true);
    const res = await callApi<{ id?: string }>("/api/decks", check.data);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    if (deck) {
      setSaved(true);
      router.refresh();
    } else {
      router.push(`/decks/${res.data.id}`);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <div>
        <Label htmlFor={`${uid}-title`}>Deck name</Label>
        <Input id={`${uid}-title`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Office English" aria-invalid={Boolean(error) && title.trim().length < 2} />
      </div>
      <div>
        <Label htmlFor={`${uid}-desc`}>Description (optional)</Label>
        <Input id={`${uid}-desc`} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="What is this deck for?" />
      </div>
      <div>
        <Label htmlFor={`${uid}-tags`}>Tags (optional, comma separated, up to 5)</Label>
        <Input id={`${uid}-tags`} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="work, interview" />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : deck ? "Save changes" : "Create deck"}
        </Button>
        {saved ? <span role="status" className="text-sm text-success">Saved</span> : null}
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </form>
  );
}
