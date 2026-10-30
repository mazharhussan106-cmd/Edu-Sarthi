// Owns the ＋ at the end of the study tabs and the sheet it opens: make a new
// tab (then open it, to add decks), and arrange every tab — move up or down,
// show or hide, rename or delete the student's own. English and My decks can
// be moved and hidden too (owner's decision 12); at least one tab stays shown.
//
// Order and show/hide change on screen first and are saved together with
// "Save order", so a few taps make one request on a slow connection. Making,
// renaming and deleting save at once, then the page is refreshed and the list
// is read again from the server. It deliberately does NOT add decks to a tab;
// the tab's own page does (TabDeckPicker).

"use client";

import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { callApi } from "@/components/decks/deckClient";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { tabNameSchema } from "@/lib/studyTabSchemas";

export type ArrangeTab = { key: string; label: string; hidden: boolean; own: boolean };

const small = "rounded-lg px-2 py-1 text-xs font-medium hover:bg-hover disabled:opacity-40";

export function ArrangeTabs({ tabs, canCreate }: { tabs: ArrangeTab[]; canCreate: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(tabs);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ key: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // After a rename or delete the server sends the tabs again; show those.
  const fresh = JSON.stringify(tabs);
  useEffect(() => {
    setList(JSON.parse(fresh) as ArrangeTab[]);
  }, [fresh]);

  const changed = JSON.stringify(list.map((t) => [t.key, t.hidden])) !== JSON.stringify(tabs.map((t) => [t.key, t.hidden]));

  async function send(body: object, after: (data: Record<string, unknown>) => void) {
    setBusy(true);
    setMessage(null);
    const r = await callApi<Record<string, unknown>>("/api/study-tabs", body);
    setBusy(false);
    if (!r.ok) return setMessage(r.error);
    after(r.data);
  }

  function create(e: React.FormEvent) {
    e.preventDefault();
    const n = tabNameSchema.safeParse(name);
    if (!n.success) return setMessage(n.error.issues[0].message);
    void send({ action: "create", name: n.data }, (d) => {
      setName("");
      setOpen(false);
      router.push(`/tabs/${String(d.id)}`);
    });
  }

  function rename(key: string) {
    const n = tabNameSchema.safeParse(editing?.name ?? "");
    if (!n.success) return setMessage(n.error.issues[0].message);
    void send({ action: "rename", id: key, name: n.data }, () => {
      setEditing(null);
      router.refresh();
    });
  }

  function remove(key: string) {
    void send({ action: "delete", id: key }, () => {
      setDeleting(null);
      // Its page is gone; the student lands on the Flashcard tab, not a 404.
      if (pathname === `/tabs/${key}`) router.push("/flashcards");
      else router.refresh();
    });
  }

  function move(i: number, by: -1 | 1) {
    setList((l) => {
      const next = [...l];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  }

  function toggle(key: string) {
    setMessage(null);
    setList((l) => {
      const next = l.map((t) => (t.key === key ? { ...t, hidden: !t.hidden } : t));
      if (next.every((t) => t.hidden)) {
        setMessage("Keep at least one tab showing, or there is nothing to open.");
        return l;
      }
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="Make or arrange your tabs"
        onClick={() => {
          setList(tabs);
          setMessage(null);
          setOpen(true);
        }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border-strong text-ink hover:bg-hover"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Your tabs">
        {canCreate ? (
          <form onSubmit={create} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor="new-tab">New tab</Label>
              <Input id="new-tab" value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, Exam prep" maxLength={60} autoComplete="off" />
            </div>
            <Button type="submit" disabled={busy}>
              Make tab
            </Button>
          </form>
        ) : (
          <p className="text-sm text-ink-muted">You have the most tabs allowed. Delete one you no longer use to make another.</p>
        )}
        <p className="mt-1 text-xs text-ink-muted">A tab holds decks you choose. A deck stays in My decks too, and can be in many tabs.</p>

        <h3 className="mt-5 text-xs font-medium text-ink-muted">Order, and which tabs show</h3>
        <ul className="mt-1 divide-y divide-border rounded-xl border border-border">
          {list.map((t, i) => (
            <li key={t.key} className="px-3 py-2">
              {editing?.key === t.key ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    rename(t.key);
                  }}
                  className="flex items-end gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`rename-${t.key}`}>New name for {t.label}</Label>
                    <Input id={`rename-${t.key}`} value={editing.name} onChange={(e) => setEditing({ key: t.key, name: e.target.value })} maxLength={60} autoComplete="off" />
                  </div>
                  <Button type="submit" size="sm" disabled={busy}>Save</Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                </form>
              ) : deleting === t.key ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-0 flex-1 text-ink">Delete “{t.label}”? Its decks stay in My decks.</span>
                  <Button size="sm" variant="outline" className="border-error text-error" onClick={() => remove(t.key)} disabled={busy}>Delete</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(null)}>Keep</Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-ink">
                    <input type="checkbox" checked={!t.hidden} onChange={() => toggle(t.key)} aria-label={`Show ${t.label}`} className="h-4 w-4 accent-accent" />
                    <span className={t.hidden ? "truncate text-ink-muted line-through" : "truncate"}>{t.label}</span>
                  </label>
                  <button type="button" className={small} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${t.label} up`}>
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" className={small} onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Move ${t.label} down`}>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {t.own ? (
                    <>
                      <button type="button" className={`${small} text-accent`} onClick={() => setEditing({ key: t.key, name: t.label })} aria-label={`Rename ${t.label}`}>
                        Rename
                      </button>
                      <button type="button" className={`${small} text-error`} onClick={() => setDeleting(t.key)} aria-label={`Delete ${t.label}`}>
                        Delete
                      </button>
                    </>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ul>
        <Button
          className="mt-3 w-full"
          disabled={!changed || busy}
          onClick={() =>
            void send({ action: "arrange", tabs: list.map((t) => ({ key: t.key, hidden: t.hidden })) }, () => {
              setOpen(false);
              router.refresh();
            })
          }
        >
          Save order
        </Button>
        {message ? (
          <p role="alert" className="mt-2 text-sm text-error">
            {message}
          </p>
        ) : null}
      </Sheet>
    </>
  );
}
