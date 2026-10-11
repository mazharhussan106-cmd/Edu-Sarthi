// Owns the interactive part of the search page: the input (focused on open),
// the Words / Chunk / Grammar choice, and the recent-searches list.
//
// Recent searches are kept in this browser's localStorage, not the account:
// they are a convenience, nobody else needs them, and storing every query a
// student types on the server would be collecting more than the feature
// needs. Every localStorage call is wrapped, because private windows and
// blocked site data make it throw.
//
// Searching itself is the flashcards page's job: this just sends the student to
// /flashcards?kind=…&q=…, the URL that page already understands.

"use client";

import { Clock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SegmentedControl } from "@/components/ui/SegmentedControl";

const KEY = "edusarthi-search-history";
const MAX = 8;
const KINDS = [
  { value: "words", label: "Words" },
  { value: "chunks", label: "Chunk" },
  { value: "grammar", label: "Grammar" },
] as const;
type Kind = (typeof KINDS)[number]["value"];

type Entry = { q: string; kind: Kind };

function load(): Entry[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((e): e is Entry => typeof e?.q === "string" && KINDS.some((k) => k.value === e?.kind))
      .slice(0, MAX);
  } catch {
    return [];
  }
}

function save(list: Entry[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // History is a nicety; failing to keep it must not block searching.
  }
}

export function SearchBox() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<Kind>("words");
  const [history, setHistory] = useState<Entry[]>([]);

  useEffect(() => {
    setHistory(load());
    input.current?.focus();
  }, []);

  function go(entry: Entry) {
    const text = entry.q.trim().slice(0, 60);
    if (!text) return;
    // Newest first, and the same search is moved up rather than repeated.
    const next = [{ q: text, kind: entry.kind }, ...history.filter((h) => !(h.q === text && h.kind === entry.kind))].slice(0, MAX);
    save(next);
    setHistory(next);
    router.push(`/flashcards?kind=${entry.kind}&q=${encodeURIComponent(text)}`);
  }

  function clear() {
    save([]);
    setHistory([]);
  }

  return (
    <div className="mt-5">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q, kind });
        }}
        className="relative"
      >
        <label htmlFor="search-q" className="sr-only">Search cards by word or ID</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-mist" aria-hidden="true" />
        <input
          ref={input}
          id="search-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={60}
          placeholder="Search a word or ID"
          className="h-12 w-full rounded-full border border-border-strong bg-surface pl-11 pr-4 text-base text-ink placeholder:text-ink-muted focus:border-accent"
        />
      </form>

      <div className="mt-4">
        <SegmentedControl label="Search in" options={KINDS} value={kind} onValueChange={(v) => setKind(v)} />
      </div>

      {history.length > 0 ? (
        <section className="mt-6" aria-labelledby="recent-heading">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="font-display text-sm font-bold text-ink">Recent searches</h2>
            <button type="button" onClick={clear} className="text-xs font-medium text-accent hover:underline">Clear</button>
          </div>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {history.map((h) => (
              <li key={`${h.kind}-${h.q}`}>
                <button
                  type="button"
                  onClick={() => go(h)}
                  className="flex min-h-12 w-full items-center gap-3 text-left text-sm text-ink hover:bg-hover"
                >
                  <Clock className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{h.q}</span>
                  <span className="shrink-0 text-xs text-ink-muted">{KINDS.find((k) => k.value === h.kind)?.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">Your recent searches will show up here.</p>
      )}
    </div>
  );
}
