// Loads content/chunk-library/chunks.json into the Word table as kind CHUNK
// and grammar.json as kind GRAMMAR (the Grammar tab), and makes sure the
// hidden system exercises for "Record yourself" on those cards exist.
//
// Safe to run again after the workbook changes: rows are matched on the app
// code (the workbook ID, with PRP renamed PFR) and updated in place, so
// students' progress and any media added in the admin stay attached.
//
// Run with:  npx tsx prisma/import-chunks.ts
// Regenerate the JSON first if the Excel changed:
//            python content/chunk-library/tools/export_json.py

import { readFileSync } from "fs";
import { PrismaClient, type CardKind } from "@prisma/client";

const prisma = new PrismaClient();

type Chunk = {
  code: string;
  type: string;
  lewis_type: string | null;
  text: string;
  level: string | null;
  order_a: number;
  order_b: number;
  [k: string]: unknown;
};

// Kept as real columns because the app filters or sorts on them; everything
// else stays in `details`.
const CORE = new Set(["code", "text", "type", "lewis_type", "level", "order_a", "order_b"]);

// Titles must match PRACTICE_TITLE in lib/flashcards.ts.
const FILES: { kind: CardKind; file: string; title: string; prompt: string }[] = [
  {
    kind: "CHUNK",
    file: "content/chunk-library/chunks.json",
    title: "Use the chunk in your own sentences",
    prompt: "Say the chunk clearly, then use it in three sentences of your own, the way you would say them in a real conversation.",
  },
  {
    kind: "GRAMMAR",
    file: "content/chunk-library/grammar.json",
    title: "Use the grammar frame in your own sentences",
    prompt: "Say the frame clearly, then fill it in three sentences of your own about your day, your work or your studies.",
  },
];

// Key-order-independent comparison (same as import-words.ts): Postgres jsonb
// hands object keys back in its own order, so a plain JSON.stringify would
// call every row "changed".
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

async function load(kind: CardKind, file: string) {
  const rows = JSON.parse(readFileSync(file, "utf8")) as Chunk[];

  // Bulk, as in import-words.ts: one read of what exists, createMany for new
  // rows, and an update only where something changed. Row-by-row upserts
  // cost a round trip per card, which from a CI runner to a remote database
  // risks the job's 15-minute limit.
  const existing = await prisma.word.findMany({
    where: { code: { in: rows.map((r) => r.code) } },
    select: { code: true, kind: true, text: true, serial: true, serialB: true, partOfSpeech: true, category: true, cefr: true, importance: true, details: true },
  });
  const byCode = new Map(existing.map((w) => [w.code, w]));

  const toCreate: Array<Record<string, unknown>> = [];
  const toUpdate: Array<{ code: string; data: Record<string, unknown> }> = [];
  for (const r of rows) {
    // Kind is part of the data: a card moved between files (the grammar
    // split) changes tab but keeps the student's progress on it.
    const data = {
      kind,
      text: r.text,
      serial: r.order_a,
      serialB: r.order_b,
      partOfSpeech: r.lewis_type,
      category: r.type,
      cefr: r.level,
      importance: null,
      details: Object.fromEntries(Object.entries(r).filter(([k]) => !CORE.has(k))),
    };
    const cur = byCode.get(r.code);
    if (!cur) toCreate.push({ code: r.code, ...data });
    else if (stable({ ...cur, code: undefined }) !== stable(data)) toUpdate.push({ code: r.code, data });
  }

  for (let i = 0; i < toCreate.length; i += 500) {
    await prisma.word.createMany({ data: toCreate.slice(i, i + 500) as never, skipDuplicates: true });
  }
  for (let i = 0; i < toUpdate.length; i += 200) {
    await prisma.$transaction(
      toUpdate.slice(i, i + 200).map((u) => prisma.word.update({ where: { code: u.code }, data: u.data as never })),
    );
  }
  console.log(`${kind} cards created: ${toCreate.length}, updated: ${toUpdate.length}, total in file: ${rows.length}`);
}

async function main() {
  for (const f of FILES) await load(f.kind, f.file);

  // Same hidden module as the word recordings (created by import-words.ts,
  // or here if chunks are imported first).
  let mod = await prisma.module.findFirst({ where: { isSystem: true, title: "Flashcard speaking" } });
  if (!mod) {
    mod = await prisma.module.create({
      data: {
        isSystem: true,
        level: 0,
        title: "Flashcard speaking",
        description: "Recordings made from a flashcard. Hidden from Learn.",
      },
    });
  }
  for (const f of FILES) {
    const ex = await prisma.exercise.findFirst({ where: { moduleId: mod.id, title: f.title } });
    if (!ex) {
      await prisma.exercise.create({
        data: { moduleId: mod.id, title: f.title, prompt: f.prompt, expects: "AUDIO", minSeconds: 15, maxSeconds: 90 },
      });
    }
  }
  console.log("Chunk and grammar exercises ready.");
}

main().finally(() => prisma.$disconnect());
