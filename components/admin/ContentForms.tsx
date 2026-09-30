// Owns the curriculum editing forms on the Content page: one for a module,
// one for an exercise. Each opens in place, saves through /api/admin/content,
// and refreshes the page's server data.
//
// Validation messages come from the server's Zod schema, so the rules live in
// one place; the form only shows what came back.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { adminPost } from "@/components/admin/adminPost";

const field =
  "w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-mist focus:border-accent focus:outline-none";

function useSave(onDone: () => void) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save(body: unknown) {
    setBusy(true);
    setError(null);
    const r = await adminPost("/api/admin/content", body);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    onDone();
    router.refresh();
  }
  return { busy, error, save };
}

type ModuleValue = { id?: string; title: string; description: string; level: number };

export function ModuleForm({ initial, label }: { initial?: ModuleValue; label: string }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<ModuleValue>(initial ?? { title: "", description: "", level: 1 });
  const { busy, error, save } = useSave(() => setOpen(false));

  if (!open) {
    return (
      <Button size="sm" variant={initial ? "ghost" : "primary"} onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }
  return (
    <div className="mt-2 grid w-full gap-2 rounded-lg border border-border bg-paper p-3 md:grid-cols-[1fr_90px]">
      <input aria-label="Module title" className={field} placeholder="Module title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
      <input aria-label="Level" className={field} type="number" min={1} max={10} value={v.level} onChange={(e) => setV({ ...v, level: Number(e.target.value) })} />
      <textarea aria-label="Description" className={`${field} md:col-span-2`} rows={2} placeholder="What this module practises" value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} />
      <div className="flex items-center gap-2 md:col-span-2">
        <Button size="sm" disabled={busy} onClick={() => void save(initial?.id ? { action: "module.update", id: initial.id, data: v } : { action: "module.create", data: v })}>
          {busy ? "Saving…" : "Save module"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        {error ? <span role="alert" className="text-xs text-error">{error}</span> : null}
      </div>
    </div>
  );
}

type ExerciseValue = {
  id?: string;
  title: string;
  prompt: string;
  expects: "AUDIO" | "VIDEO" | "IMAGE";
  minSeconds: number | null;
  maxSeconds: number | null;
};

export function ExerciseForm({ moduleId, initial, label }: { moduleId: string; initial?: ExerciseValue; label: string }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<ExerciseValue>(initial ?? { title: "", prompt: "", expects: "AUDIO", minSeconds: 30, maxSeconds: 90 });
  const { busy, error, save } = useSave(() => setOpen(false));
  const num = (s: string) => (s === "" ? null : Number(s));

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {label}
      </Button>
    );
  }
  return (
    <div className="mt-2 grid w-full gap-2 rounded-lg border border-border bg-paper p-3 md:grid-cols-[1fr_120px_90px_90px]">
      <input aria-label="Exercise title" className={field} placeholder="Exercise title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
      <select aria-label="Expects" className={field} value={v.expects} onChange={(e) => setV({ ...v, expects: e.target.value as ExerciseValue["expects"] })}>
        <option value="AUDIO">Audio</option>
        <option value="VIDEO">Video</option>
        <option value="IMAGE">Photo</option>
      </select>
      <input aria-label="Minimum seconds" className={field} type="number" placeholder="Min s" value={v.minSeconds ?? ""} onChange={(e) => setV({ ...v, minSeconds: num(e.target.value) })} />
      <input aria-label="Maximum seconds" className={field} type="number" placeholder="Max s" value={v.maxSeconds ?? ""} onChange={(e) => setV({ ...v, maxSeconds: num(e.target.value) })} />
      <textarea aria-label="Prompt" className={`${field} md:col-span-4`} rows={3} placeholder="What the student should say or write" value={v.prompt} onChange={(e) => setV({ ...v, prompt: e.target.value })} />
      <div className="flex items-center gap-2 md:col-span-4">
        <Button size="sm" disabled={busy} onClick={() => void save(initial?.id ? { action: "exercise.update", id: initial.id, data: v } : { action: "exercise.create", moduleId, data: v })}>
          {busy ? "Saving…" : "Save exercise"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
        {error ? <span role="alert" className="text-xs text-error">{error}</span> : null}
      </div>
    </div>
  );
}
