// Owns the forms a person without an institute sees — apply for one, or join
// one with a code — plus Leave and Apply-again. Validates with the same Zod
// schemas the API enforces.
//
// It deliberately does NOT manage members or the join code (MemberControls).

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { callApi } from "@/components/decks/deckClient";
import { applySchema, instituteActionSchema } from "@/lib/instituteSchemas";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(body: unknown) {
    const check = instituteActionSchema.safeParse(body);
    if (!check.success) return setError(check.error.issues[0]?.message ?? "Check the fields and try again.");
    setBusy(true);
    setError(null);
    const res = await callApi("/api/institute", check.data);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }
  return { busy, error, run };
}

export function JoinForm() {
  const uid = useId();
  const [code, setCode] = useState("");
  const { busy, error, run } = useAction();
  return (
    <form onSubmit={(e) => { e.preventDefault(); void run({ action: "join", code }); }} className="flex flex-col gap-3" noValidate>
      <div>
        <Label htmlFor={`${uid}-code`}>Join code from your institute</Label>
        <Input id={`${uid}-code`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} autoComplete="off" className="font-mono uppercase tracking-widest" />
      </div>
      <div><Button type="submit" disabled={busy}>{busy ? "Joining…" : "Join institute"}</Button></div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </form>
  );
}

export function ApplyForm({ label = "Send application" }: { label?: string }) {
  const uid = useId();
  const [f, setF] = useState({ name: "", description: "", contact: "" });
  const { busy, error, run } = useAction();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const check = applySchema.safeParse(f);
        void run({ action: "apply", ...(check.success ? check.data : f) });
      }}
      className="flex flex-col gap-3"
      noValidate
    >
      <div>
        <Label htmlFor={`${uid}-name`}>Institute name</Label>
        <Input id={`${uid}-name`} value={f.name} onChange={set("name")} maxLength={100} />
      </div>
      <div>
        <Label htmlFor={`${uid}-desc`}>What does it teach, and who for?</Label>
        <textarea id={`${uid}-desc`} value={f.description} onChange={set("description")} maxLength={600} rows={3} className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-ink focus:border-accent" />
      </div>
      <div>
        <Label htmlFor={`${uid}-contact`}>Phone or email we can reach you on</Label>
        <Input id={`${uid}-contact`} value={f.contact} onChange={set("contact")} maxLength={120} />
      </div>
      <div><Button type="submit" disabled={busy}>{busy ? "Sending…" : label}</Button></div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </form>
  );
}

export function LeaveButton() {
  const { busy, error, run } = useAction();
  return (
    <div>
      <Button variant="ghost" disabled={busy} onClick={() => { if (window.confirm("Leave this institute? Decks you shared with it go back to private.")) void run({ action: "leave" }); }} className="text-error">
        Leave institute
      </Button>
      {error ? <p role="alert" className="mt-1 text-sm text-error">{error}</p> : null}
    </div>
  );
}
