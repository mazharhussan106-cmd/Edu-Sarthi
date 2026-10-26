// Owns the "Make cards with AI" card on the deck page, as one flow: say what
// you want (and give any material), answer the AI's few questions, read the
// cards it made as chapters, then add the ones you want to this deck.
//
// Nothing enters a deck until the last step. With a deckId the cards are added to
// that deck (/api/decks/[id]/ai-cards); without one, the person names a new deck
// and it is created with the cards in one request (/api/decks/ai-cards/new-deck).
// Both mark the cards AI-assisted on the server. It deliberately does NOT make
// cards itself or count the allowance; the routes do.

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import { AiDraftList, type Draft } from "@/components/decks/AiDraftList";
import { AiQuestionForm, type Answers } from "@/components/decks/AiQuestionForm";
import { AiSourcesField, type SourceItem } from "@/components/decks/AiSourcesField";
import { callApi } from "@/components/decks/deckClient";
import { MAX_CARDS_PER_REQUEST, addAiCardsSchema, newAiDeckSchema, requestSchema } from "@/lib/aiCardSchemas";
import type { Question } from "@/lib/aiCards";

type Stage = "start" | "asking" | "questions" | "making" | "drafts" | "adding";
type Made = { chapters: { title: string; cards: { front: string; back: string; example: string; body: string }[] }[]; dropped: number; note: string; clamped: boolean; remaining: number | null };

const DISCLAIMER = "EduSarthi can make mistakes. Check important info.";

/// A starting name for a new deck from what the person asked for: its first
/// line, cut at a word, without trailing punctuation. They can change it.
function suggestTitle(request: string): string {
  const line = request.split("\n")[0].trim().replace(/[.,;:!?\s]+$/, "");
  return line.length <= 60 ? line : line.slice(0, 60).replace(/\s+\S*$/, "");
}

export function AiCardsPanel({ deckId }: { deckId?: string }) {
  const router = useRouter();
  const uid = useId();
  const [stage, setStage] = useState<Stage>("start");
  const [request, setRequest] = useState("");
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [title, setTitle] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [info, setInfo] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = stage === "asking" || stage === "making" || stage === "adding";

  const body = () => ({
    request,
    sources: sources.map((s) => (s.kind === "text" ? { type: "text" as const, text: s.text } : { type: "file" as const, id: s.id })),
  });

  async function ask() {
    const early = requestSchema.safeParse(body());
    if (!early.success) return setError(early.error.issues[0]?.message ?? "Check what you typed and try again.");
    setError(null);
    setDone(null);
    setStage("asking");
    const res = await callApi<{ questions: Question[]; remaining: number | null }>("/api/decks/ai-cards/questions", early.data);
    if (!res.ok) {
      setStage("start");
      return setError(res.error);
    }
    setQuestions(res.data.questions);
    setAnswers(Object.fromEntries(res.data.questions.map((q) => [q.id, q.suggested])));
    setRemaining(res.data.remaining);
    setStage("questions");
  }

  async function make() {
    const n = Number(answers.count?.[0]);
    if (!Number.isInteger(n) || n < 1 || n > MAX_CARDS_PER_REQUEST) return setError(`Choose how many cards you want, from 1 to ${MAX_CARDS_PER_REQUEST}.`);
    setError(null);
    setStage("making");
    const res = await callApi<Made>("/api/decks/ai-cards/make", { ...body(), questions, answers });
    if (!res.ok) {
      setStage("questions");
      return setError(res.error);
    }
    const m = res.data;
    setDrafts(m.chapters.flatMap((c) => c.cards.map((card) => ({ ...card, key: crypto.randomUUID(), chapter: c.title, include: true }))));
    setRemaining(m.remaining);
    setInfo([
      m.note,
      m.clamped ? "You are near your free limit, so fewer cards were made than you asked for." : "",
      m.dropped ? `${m.dropped} card${m.dropped === 1 ? " was" : "s were"} left out because ${m.dropped === 1 ? "it was" : "they were"} too long or repeated.` : "",
    ].filter(Boolean));
    // The server deleted the files once the cards were made.
    setSources((s) => s.filter((x) => x.kind === "text"));
    setTitle(suggestTitle(request));
    setStage("drafts");
  }

  async function add() {
    const cards = drafts.filter((d) => d.include).map(({ front, back, example, body: b, chapter }) => ({ front, back, example, body: b, chapter }));
    const early = deckId ? addAiCardsSchema.safeParse({ cards }) : newAiDeckSchema.safeParse({ title, cards });
    if (!early.success) return setError(early.error.issues[0]?.message ?? "Check the cards and try again.");
    setError(null);
    setStage("adding");
    const res = await callApi<{ id?: string }>(deckId ? `/api/decks/${deckId}/ai-cards` : "/api/decks/ai-cards/new-deck", early.data);
    if (!res.ok) {
      setStage("drafts");
      return setError(res.error);
    }
    if (!deckId) {
      // The new deck is the place to read and study what was made.
      router.push(`/decks/${res.data.id}`);
      return;
    }
    router.refresh();
    setDone(`Added ${cards.length} card${cards.length === 1 ? "" : "s"} to this deck, marked AI-assisted. Read them before you share the deck.`);
    setDrafts([]);
    setRequest("");
    setStage("start");
  }

  function discard() {
    if (!window.confirm("Discard these cards? They still count toward your free AI cards.")) return;
    setDrafts([]);
    setStage("start");
  }

  const chosen = drafts.filter((d) => d.include).length;

  return (
    <Card className="mt-3">
      <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
        <Sparkles className="size-4 text-accent" aria-hidden="true" /> {deckId ? "Make cards with AI" : "Make a new deck with AI"}
      </h3>
      <p className="mt-1 text-xs text-ink-muted">
        Tell the AI what you want. It asks a few questions, then makes cards for you to check. {DISCLAIMER}
        {remaining === null ? "" : ` You have ${remaining} free AI card${remaining === 1 ? "" : "s"} left. Every card the AI makes counts, even one you do not keep.`}
      </p>
      {done ? <p role="status" className="mt-3 rounded-lg bg-success/12 px-3 py-2 text-sm text-success">{done}</p> : null}
      <p role="status" aria-live="polite" className="mt-3 text-sm text-ink-muted">
        {stage === "asking" ? "Thinking of the right questions…" : stage === "making" ? "Making your cards. This can take a minute or two; keep this page open." : stage === "adding" ? (deckId ? "Adding…" : "Creating your deck…") : ""}
      </p>

      {stage === "start" || stage === "asking" ? (
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <Label htmlFor={`${uid}-req`}>What do you want cards for?</Label>
            <textarea
              id={`${uid}-req`}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={3}
              maxLength={2000}
              disabled={busy}
              placeholder="A word, a sentence, a topic, a chapter, a concept or a book. For example: Class 9 Physics chapter 3, Newton's laws"
              className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-accent"
            />
          </div>
          <AiSourcesField sources={sources} onChange={setSources} disabled={busy} />
          <div><Button onClick={() => void ask()} disabled={busy}>Next: a few questions</Button></div>
        </div>
      ) : null}

      {stage === "questions" || stage === "making" ? (
        <div className="mt-3 flex flex-col gap-4">
          <AiQuestionForm questions={questions} answers={answers} onAnswer={(id, v) => setAnswers((a) => ({ ...a, [id]: v }))} disabled={busy} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void make()} disabled={busy}>{stage === "making" ? "Making…" : "Make cards"}</Button>
            <Button variant="ghost" onClick={() => { setError(null); setStage("start"); }} disabled={busy}>Back</Button>
          </div>
        </div>
      ) : null}

      {stage === "drafts" || stage === "adding" ? (
        <div className="mt-3 flex flex-col gap-4">
          {info.length ? <ul className="flex flex-col gap-1 text-sm text-ink-muted">{info.map((t) => <li key={t}>{t}</li>)}</ul> : null}
          {deckId ? null : (
            <div>
              <Label htmlFor={`${uid}-title`}>Name of the new deck</Label>
              <Input id={`${uid}-title`} value={title} maxLength={80} disabled={busy} onChange={(e) => setTitle(e.target.value)} />
            </div>
          )}
          <AiDraftList drafts={drafts} onChange={setDrafts} />
          <p className="text-xs text-ink-muted">{DISCLAIMER} Tick the cards you want, edit any that need it, then add them.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void add()} disabled={busy || chosen === 0}>{stage === "adding" ? (deckId ? "Adding…" : "Creating…") : deckId ? `Add ${chosen} card${chosen === 1 ? "" : "s"} to this deck` : `Create the deck with ${chosen} card${chosen === 1 ? "" : "s"}`}</Button>
            <Button variant="ghost" onClick={discard} disabled={busy}>Discard these cards</Button>
          </div>
        </div>
      ) : null}

      {error ? <p role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
    </Card>
  );
}
