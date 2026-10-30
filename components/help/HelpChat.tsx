// Owns the "Ask EduSarthi help" box on the Help page: type a question, read
// the AI's answer, ask a follow-up. The conversation lives only in this
// component (a reload clears it); the last few turns go with each question.
//
// It says plainly what the box is: an AI that knows how the app works, can be
// wrong, and cannot see the person's account. It deliberately renders answers
// as plain text, never as HTML or markdown.

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Input";
import { HELP_LIMITS, helpAskSchema, type HelpTurn } from "@/lib/aiHelpSchemas";

type Reply = { answer?: string; error?: string; left?: number };

async function ask(question: string, history: HelpTurn[]): Promise<Reply> {
  try {
    const res = await fetch("/api/help/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, history }) });
    try {
      const data = JSON.parse(await res.text()) as Reply;
      return res.ok && data.answer ? data : { error: data.error ?? "The AI help could not answer just now. Ask again.", left: data.left };
    } catch {
      return { error: "The AI help took too long or failed. Ask again in a moment." };
    }
  } catch {
    return { error: "No connection. Check your internet and ask again." };
  }
}

export function HelpChat({ initialLeft }: { initialLeft: number }) {
  const [turns, setTurns] = useState<HelpTurn[]>([]);
  const [question, setQuestion] = useState("");
  const [left, setLeft] = useState(initialLeft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (turns.length) endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = helpAskSchema.safeParse({ question, history: turns.slice(-HELP_LIMITS.turns) });
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Type your question first.");
    setBusy(true);
    setError(null);
    const reply = await ask(parsed.data.question, parsed.data.history);
    setBusy(false);
    if (typeof reply.left === "number") setLeft(reply.left);
    if (!reply.answer) return setError(reply.error ?? "The AI help could not answer just now. Ask again.");
    setTurns((t) => [...t, { role: "user", text: parsed.data.question }, { role: "assistant", text: reply.answer! }]);
    setQuestion("");
  }

  return (
    <Card className="mt-6">
      <CardTitle>Ask EduSarthi help</CardTitle>
      <p className="mt-1 text-xs text-ink-muted">
        An AI that knows how EduSarthi works. It can make mistakes and cannot see your account. Ask in English, Hindi or Hinglish.
      </p>

      {turns.length ? (
        <ol aria-live="polite" className="mt-4 flex flex-col gap-3">
          {turns.map((t, i) => (
            <li key={i} className={t.role === "user" ? "self-end max-w-[85%] rounded-xl bg-accent/12 px-3 py-2" : "max-w-[95%] rounded-xl border border-border bg-surface-raised px-3 py-2"}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">{t.role === "user" ? "You" : "EduSarthi help (AI)"}</p>
              <p className="mt-0.5 whitespace-pre-line break-words text-sm text-ink">{t.text}</p>
            </li>
          ))}
        </ol>
      ) : null}
      <div ref={endRef} />

      {left > 0 ? (
        <form onSubmit={submit} className="mt-4 flex flex-col gap-2">
          <Label htmlFor="help-question">Your question</Label>
          <textarea
            id="help-question"
            rows={2}
            maxLength={HELP_LIMITS.questionChars}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. How do I change my email?  /  Mera audit kab aayega?"
            className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 font-body text-sm text-ink placeholder:text-ink-muted hover:border-border-strong focus:border-accent"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-ink-muted">{left} {left === 1 ? "question" : "questions"} left today</span>
            <Button type="submit" size="sm" disabled={busy || question.trim().length < 2}>
              {busy ? "Thinking…" : turns.length ? "Ask again" : "Ask"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink-muted">You have used today&apos;s questions. The count starts again at midnight India time; the answers below may already help.</p>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-ink-muted">
        Need a person? Write to us from the <Link href="/support" className="font-medium text-accent hover:underline">Support page</Link>.
      </p>
    </Card>
  );
}
