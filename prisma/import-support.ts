// Loads content/support-cards/support.json into the Word table as kind
// SUPPORT (the Support tab), and makes sure the hidden system exercises for
// "Record yourself for audit" on those cards exist: one spoken (Voice and
// Chat cards) and one photo of a written email (Email cards).
//
// Safe to run again after the workbook changes: rows are matched on the card
// ID (CSV-B-001 …) and updated in place, so students' progress and any media
// added in the admin stay attached.
//
// It deliberately does not read the Excel file. The workbook is the editing
// source; support.json is exported from it (content/support-cards/source/
// build.py), so this script needs no spreadsheet library in CI.
//
// Run with:  npx tsx prisma/import-support.ts

import { readFileSync } from "fs";
import { PrismaClient, type MediaKind } from "@prisma/client";

const prisma = new PrismaClient();

type Row = { id: string; sentence: string; channel: string; level: string; cefr: string; importance: string; [k: string]: string };

// Kept as real columns because the app filters or sorts on them; everything
// else stays in `details`.
const CORE = new Set(["id", "sentence", "channel", "level", "cefr", "importance"]);

// Titles must match PRACTICE_TITLE.SUPPORT and SUPPORT_EMAIL_TITLE in lib/flashcards.ts.
const EXERCISES: { title: string; prompt: string; expects: MediaKind; minSeconds: number | null; maxSeconds: number | null }[] = [
  {
    title: "Say the support line for audit",
    prompt:
      "Do the card's record task: say the line the way you would on a real call or in a voice note, then the next thing you would say to the customer.",
    expects: "AUDIO",
    minSeconds: 10,
    maxSeconds: 90,
  },
  {
    title: "Write the support email for audit",
    prompt:
      "Do the card's write task: write the email on paper or on your phone, then send a clear photo or screenshot of it for your teacher to audit.",
    expects: "IMAGE",
    minSeconds: null,
    maxSeconds: null,
  },
];

// Key-order-independent comparison (same as import-chunks.ts): Postgres jsonb
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

async function load() {
  const rows = JSON.parse(readFileSync("content/support-cards/support.json", "utf8")) as Row[];
  const existing = await prisma.word.findMany({
    where: { code: { in: rows.map((r) => r.id) } },
    select: { code: true, kind: true, text: true, serial: true, serialB: true, partOfSpeech: true, category: true, cefr: true, importance: true, details: true },
  });
  const byCode = new Map(existing.map((w) => [w.code, w]));

  const toCreate: Array<Record<string, unknown>> = [];
  const toUpdate: Array<{ code: string; data: Record<string, unknown> }> = [];
  rows.forEach((r, i) => {
    const imp = Number.parseInt(r.importance, 10);
    const data = {
      kind: "SUPPORT" as const,
      text: r.sentence,
      // The file is already in study order: Voice → Chat → Email, and
      // Basic → Intermediate → Advanced inside each.
      serial: i + 1,
      serialB: null,
      partOfSpeech: r.level,
      category: r.channel.toLowerCase(),
      cefr: r.cefr,
      importance: Number.isFinite(imp) ? imp : null,
      details: Object.fromEntries(Object.entries(r).filter(([k]) => !CORE.has(k))),
    };
    const cur = byCode.get(r.id);
    if (!cur) toCreate.push({ code: r.id, ...data });
    else if (stable({ ...cur, code: undefined }) !== stable(data)) toUpdate.push({ code: r.id, data });
  });

  for (let i = 0; i < toCreate.length; i += 500) {
    await prisma.word.createMany({ data: toCreate.slice(i, i + 500) as never, skipDuplicates: true });
  }
  for (let i = 0; i < toUpdate.length; i += 200) {
    await prisma.$transaction(
      toUpdate.slice(i, i + 200).map((u) => prisma.word.update({ where: { code: u.code }, data: u.data as never })),
    );
  }
  console.log(`SUPPORT cards created: ${toCreate.length}, updated: ${toUpdate.length}, total in file: ${rows.length}`);
}

async function main() {
  await load();

  // Same hidden module as the word and chunk recordings.
  let mod = await prisma.module.findFirst({ where: { isSystem: true, title: "Flashcard speaking" } });
  if (!mod) {
    mod = await prisma.module.create({
      data: { isSystem: true, level: 0, title: "Flashcard speaking", description: "Recordings made from a flashcard. Hidden from Learn." },
    });
  }
  for (const e of EXERCISES) {
    const ex = await prisma.exercise.findFirst({ where: { moduleId: mod.id, title: e.title } });
    if (!ex) await prisma.exercise.create({ data: { moduleId: mod.id, ...e } });
  }
  console.log("Support exercises ready.");
}

main().finally(() => prisma.$disconnect());
