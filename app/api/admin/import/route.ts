// Owns the admin's Excel upload: "check" reads the file and reports what it
// found (cards by topic, problems) without saving; "import" saves it as a
// published deck. The same file is sent for both steps, so nothing is kept on
// the server between them.
//
// A file with any error is never imported — half a deck is worse than none.
// It deliberately does NOT run card code or trust the filename; the deck's
// title comes from the form.

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { parseCardsXlsx, topicCounts, MAX_XLSX_BYTES } from "@/lib/xlsxCards";
import { importDeck } from "@/lib/xlsxImport";

export const runtime = "nodejs";

const meta = z.object({
  title: z.string().trim().min(3, "Give the deck a name of at least 3 characters").max(80, "Keep the deck name under 80 characters"),
  description: z.string().trim().max(300, "Keep the description under 300 characters").default(""),
  tags: z.string().default("").transform((s) => [...new Set(s.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 5)),
});

const fail = (error: string, status = 400, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return fail("Admins only.", 403);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("The upload did not arrive. Choose the file and try again.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail("Choose an Excel (.xlsx) file first.");
  if (file.size > MAX_XLSX_BYTES) return fail(`That file is over ${MAX_XLSX_BYTES / 1024 / 1024} MB. Split the deck into two files and upload them one at a time.`);

  const parsed = await parseCardsXlsx(Buffer.from(await file.arrayBuffer()));
  if (parsed.errors.length) return fail("The file has problems. Fix them in Excel and upload again.", 400, { errors: parsed.errors });

  const summary = {
    cards: parsed.cards.length,
    sheets: parsed.sheets,
    topics: topicCounts(parsed.cards),
    warnings: parsed.warnings.slice(0, 20),
  };
  if (form.get("commit") !== "1") return NextResponse.json({ ok: true, summary });

  const m = meta.safeParse({ title: form.get("title"), description: form.get("description") ?? "", tags: form.get("tags") ?? "" });
  if (!m.success) return fail(m.error.issues[0]?.message ?? "Check the deck name.");
  const res = await importDeck(admin.id, parsed.cards, m.data);
  return "error" in res ? fail(res.error) : NextResponse.json({ ok: true, summary, deckId: res.deckId, created: res.created, updated: res.updated });
}
