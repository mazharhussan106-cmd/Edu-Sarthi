// Owns the form for adding or editing one card: front, back, example,
// Markdown notes, an optional picture and an optional recording.
//
// Media is uploaded here, on Save, before the card is written — so a card
// never points at a file that failed to upload, and an abandoned form stores
// nothing. The API re-checks every key regardless.
//
// It deliberately does NOT list the deck's cards or issue upload URLs.

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { callApi, uploadMedia } from "@/components/decks/deckClient";
import { MediaField } from "@/components/decks/MediaField";
import { cardActionSchema } from "@/lib/deckSchemas";

export type EditableCard = {
  id: string;
  front: string;
  back: string;
  example: string;
  body: string;
  imageKey: string | null;
  audioKey: string | null;
  imageSrc: string | null;
  audioSrc: string | null;
  /// Embed address already stored on the card ("" when none).
  videoUrl: string;
  videoSrc: string | null;
  audit: string;
};

type Slot = { file: File | null; keep: boolean };

/// `staff` shows the teacher-only sections. The server enforces it too — the
/// flag only decides what the form offers.
export function CardEditor({ deckId, card, staff, onDone }: { deckId: string; card?: EditableCard; staff: boolean; onDone?: () => void }) {
  const router = useRouter();
  const uid = useId();
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [example, setExample] = useState(card?.example ?? "");
  const [body, setBody] = useState(card?.body ?? "");
  const [videoUrl, setVideoUrl] = useState(card?.videoUrl ?? "");
  const [audit, setAudit] = useState(card?.audit ?? "");
  const [image, setImage] = useState<Slot>({ file: null, keep: Boolean(card?.imageKey) });
  const [audio, setAudio] = useState<Slot>({ file: null, keep: Boolean(card?.audioKey) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Remounts the media fields after "Save and add another".
  const [round, setRound] = useState(0);

  async function keyFor(slot: Slot, kind: "IMAGE" | "AUDIO", current: string | null) {
    if (slot.file) return uploadMedia(slot.file, kind);
    return { ok: true as const, data: { key: slot.keep ? current : null } };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Checked before any upload, so a missing field does not cost a 2 MB PUT.
    const draft = { front, back, example, body, imageKey: null, audioKey: null, videoUrl: staff ? videoUrl : "", audit: staff ? audit : "" };
    const early = cardActionSchema.safeParse(card ? { action: "edit", cardId: card.id, ...draft } : { action: "add", ...draft });
    if (!early.success) return setError(early.error.issues[0]?.message ?? "Check the fields and try again.");

    setBusy(true);
    const [img, aud] = await Promise.all([keyFor(image, "IMAGE", card?.imageKey ?? null), keyFor(audio, "AUDIO", card?.audioKey ?? null)]);
    if (!img.ok || !aud.ok) {
      setBusy(false);
      return setError(!img.ok ? img.error : !aud.ok ? aud.error : "Upload failed.");
    }
    const res = await callApi(`/api/decks/${deckId}/cards`, {
      ...early.data,
      imageKey: img.data.key,
      audioKey: aud.data.key,
    });
    setBusy(false);
    if (!res.ok) return setError(res.error);

    router.refresh();
    if (card) return onDone?.();
    // New card: clear the form so the next one can be typed straight away.
    setFront("");
    setBack("");
    setExample("");
    setBody("");
    setVideoUrl("");
    setAudit("");
    setImage({ file: null, keep: false });
    setAudio({ file: null, keep: false });
    setRound((r) => r + 1);
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-3" noValidate>
      <div>
        <Label htmlFor={`${uid}-front`}>Front (the question or word)</Label>
        <Input id={`${uid}-front`} value={front} onChange={(e) => setFront(e.target.value)} maxLength={200} />
      </div>
      <div>
        <Label htmlFor={`${uid}-back`}>Back (the answer or meaning)</Label>
        <Input id={`${uid}-back`} value={back} onChange={(e) => setBack(e.target.value)} maxLength={500} />
      </div>
      <div>
        <Label htmlFor={`${uid}-ex`}>Example sentence (optional)</Label>
        <Input id={`${uid}-ex`} value={example} onChange={(e) => setExample(e.target.value)} maxLength={300} />
      </div>
      <div>
        <Label htmlFor={`${uid}-body`}>Extra notes (optional) — **bold**, *italic*, - lists, `code`</Label>
        <textarea id={`${uid}-body`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={4} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none" />
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-xs font-medium text-ink-muted">Picture (optional, up to 2 MB)</legend>
        <MediaField key={`i${round}`} kind="IMAGE" existingSrc={card?.imageSrc ?? null} disabled={busy} onChange={setImage} />
      </fieldset>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-xs font-medium text-ink-muted">Pronunciation or speaking (optional, up to 60 seconds)</legend>
        <MediaField key={`a${round}`} kind="AUDIO" existingSrc={card?.audioSrc ?? null} disabled={busy} onChange={setAudio} />
      </fieldset>
      {staff ? (
        <>
          <div>
            <Label htmlFor={`${uid}-video`}>Video link (YouTube or Google Drive)</Label>
            <Input id={`${uid}-video`} value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} maxLength={300} placeholder="https://youtu.be/…" inputMode="url" />
            <p className="mt-1 text-xs text-ink-muted">For a Drive file, set sharing to “Anyone with the link” first, or learners will see a locked player.</p>
          </div>
          <div>
            <Label htmlFor={`${uid}-audit`}>Teacher’s guide — what to listen for (optional)</Label>
            <textarea id={`${uid}-audit`} value={audit} onChange={(e) => setAudit(e.target.value)} maxLength={1000} rows={3} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none" />
          </div>
        </>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Saving…" : card ? "Save card" : "Add card"}</Button>
        {card ? <Button variant="ghost" disabled={busy} onClick={onDone}>Cancel</Button> : null}
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </form>
  );
}
