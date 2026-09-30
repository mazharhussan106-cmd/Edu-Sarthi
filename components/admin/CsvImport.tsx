// Owns the bulk exercise importer: pick a CSV (Excel → Save As → CSV UTF-8),
// check it, see every bad row by number, then import.
//
// Two steps on purpose, per the spec: nothing is written until a dry run has
// passed, and the import itself is all-or-nothing on the server.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { adminPost } from "@/components/admin/adminPost";

type Result = { ok: boolean; rows: number; errors: string[] };

export function CsvImport() {
  const router = useRouter();
  const [csv, setCsv] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [check, setCheck] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  async function run(commit: boolean) {
    if (!csv) return;
    setBusy(true);
    setError(null);
    const r = await adminPost<Result>("/api/admin/content", { action: "import", csv, commit });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (commit) {
      setDone(r.data.rows);
      setCsv(null);
      setCheck(null);
      router.refresh();
    } else {
      setCheck(r.data);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Columns: <code className="font-mono text-xs">module_title, level, module_description, title, prompt, expects, min_seconds, max_seconds</code>.
        Modules are matched by title and created if new. <code className="font-mono text-xs">expects</code> is AUDIO, VIDEO or IMAGE.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border-strong px-3 text-xs text-ink hover:bg-hover">
          Choose CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setName(f.name);
              setCsv(await f.text());
              setCheck(null);
              setDone(null);
            }}
          />
        </label>
        {name ? <span className="text-xs text-ink-muted">{name}</span> : null}
        <Button size="sm" variant="outline" disabled={!csv || busy} onClick={() => void run(false)}>
          {busy && !check ? "Checking…" : "Check file"}
        </Button>
        <Button size="sm" disabled={!check?.ok || busy} onClick={() => void run(true)}>
          {busy && check ? "Importing…" : check?.ok ? `Import ${check.rows} exercises` : "Import"}
        </Button>
      </div>
      {error ? <p role="alert" className="mt-2 text-xs text-error">{error}</p> : null}
      {check ? (
        check.errors.length ? (
          <div role="alert" className="mt-3 rounded-lg bg-error/10 p-3 text-xs text-error">
            <p className="font-medium">Fix these rows, then check again. Nothing was imported.</p>
            <ul className="mt-1 list-disc pl-4">
              {check.errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        ) : (
          <p className="mt-3 text-xs text-success">{check.rows} rows look good.</p>
        )
      ) : null}
      {done !== null ? <p className="mt-3 text-xs text-success">Imported {done} exercises.</p> : null}
    </div>
  );
}
