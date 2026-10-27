// Owns the institute admin's logo box: the approved logo and the one waiting
// for the site admin, the refusal note, uploading a new file (ask the API for
// a signed URL, send the file, then hand the key back) and removing the logo.
// The file is checked with the same schema the API enforces.
//
// It deliberately does NOT approve anything: a new logo shows on decks only
// after the EduSarthi admin accepts it (lib/instituteLogo).

"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { callApi } from "@/components/decks/deckClient";
import { logoFileSchema } from "@/lib/instituteSchemas";

type Props = { current: string | null; pending: string | null; note: string | null };

async function send(url: string, file: File): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    return res.ok;
  } catch {
    return false;
  }
}

export function LogoForm({ current, pending, note }: Props) {
  const uid = useId();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    const check = logoFileSchema.safeParse({ filename: file.name || "logo", contentType: file.type, sizeBytes: file.size });
    if (!check.success) return setError(check.error.issues[0]?.message ?? "Pick a PNG, JPG or WebP picture up to 1 MB.");
    setBusy(true);
    const target = await callApi<{ key: string; url: string }>("/api/institute", { action: "logoUpload", ...check.data });
    if (!target.ok) {
      setBusy(false);
      return setError(target.error);
    }
    if (!(await send(target.data.url, file))) {
      setBusy(false);
      return setError("The logo did not upload. Check your connection and choose the file again.");
    }
    const saved = await callApi("/api/institute", { action: "setLogo", key: target.data.key });
    setBusy(false);
    if (!saved.ok) return setError(saved.error);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm("Remove the logo from all of the institute’s library decks?")) return;
    setBusy(true);
    setError(null);
    const res = await callApi("/api/institute", { action: "removeLogo" });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-ink">Logo</p>
        <p className="mt-0.5 text-xs text-ink-muted">Shown beside the institute’s name on decks it publishes to the library. PNG, JPG or WebP, up to 1 MB. The EduSarthi admin checks every logo before it appears.</p>
      </div>
      <div className="flex flex-wrap items-start gap-4">
        {current ? (
          <figure className="flex flex-col items-start gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt="Your institute’s current logo" className="size-16 rounded-lg border border-border bg-surface object-contain" />
            <figcaption><Badge variant="success">Showing on decks</Badge></figcaption>
          </figure>
        ) : null}
        {pending ? (
          <figure className="flex flex-col items-start gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending} alt="The logo waiting for approval" className="size-16 rounded-lg border border-border bg-surface object-contain" />
            <figcaption><Badge variant="accent">Waiting for approval</Badge></figcaption>
          </figure>
        ) : null}
      </div>
      {note ? <p className="rounded-lg bg-error/12 p-2 text-sm text-ink"><b>Logo not approved:</b> {note} Upload a different one.</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`${uid}-file`} className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-border-strong px-3 text-sm text-ink hover:bg-hover has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent">
          {busy ? "Uploading…" : current || pending ? "Upload a new logo" : "Upload a logo"}
          <input
            id={`${uid}-file`}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f);
            }}
          />
        </label>
        {current || pending ? <Button variant="ghost" size="sm" disabled={busy} className="text-error" onClick={() => void remove()}>Remove logo</Button> : null}
      </div>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
