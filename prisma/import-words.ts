// Loads content/wordmaster-2000/words.json into the Word table, and makes
// sure the hidden system exercise used by "Record yourself" on a flashcard
// exists.
//
// Safe to run again after the sheet changes: rows are matched on the sheet's
// Word ID (code) and updated in place, so students' progress (CardState) and
// any media URLs added in the admin stay attached.
//
// Run with:  npx tsx prisma/import-words.ts
// Regenerate the JSON first if the Excel changed:
//            python content/wordmaster-2000/tools/export_json.py

import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Row = Record<string, string>;

// Kept as real columns because the app filters or sorts on them; everything
// else stays in `details`.
const CORE = new Set(["word_id", "word", "s_no", "part_of_speech", "category", "cefr_level", "importance_1_5"]);

export const WORD_PRACTICE_TITLE = "Use the word in your own sentences";

// Key-order-independent comparison: Postgres jsonb hands object keys back in
// its own order, so a plain JSON.stringify would call every row "changed".
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stable(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

async function main() {
  const rows = JSON.parse(readFileSync("content/wordmaster-2000/words.json", "utf8")) as Row[];

  // One round trip to read what exists, one createMany per chunk for new rows,
  // and an update only for rows whose content actually changed. Row-by-row
  // upserts cost 2+ round trips per word, which from a CI runner to a remote
  // database ran past the 15-minute job limit for 2,227 words.
  const existing = await prisma.word.findMany({
    // Only the sheet's own words — never every card in the table, which now
    // includes other people's deck cards and their large details.
    where: { code: { in: rows.map((r) => r.word_id) } },
    select: { code: true, text: true, serial: true, partOfSpeech: true, category: true, cefr: true, importance: true, details: true },
  });
  const byCode = new Map(existing.map((w) => [w.code, w]));

  const toCreate: Array<Record<string, unknown>> = [];
  const toUpdate: Array<{ code: string; data: Record<string, unknown> }> = [];
  for (const r of rows) {
    const details = Object.fromEntries(Object.entries(r).filter(([k]) => !CORE.has(k)));
    const data = {
      text: r.word,
      serial: Number(r.s_no) || 0,
      partOfSpeech: r.part_of_speech ?? null,
      category: r.category ?? null,
      cefr: r.cefr_level ?? null,
      importance: Number(r.importance_1_5) || null,
      details,
    };
    const cur = byCode.get(r.word_id);
    if (!cur) {
      toCreate.push({ code: r.word_id, kind: "WORD", ...data });
    } else if (stable({ ...cur, code: undefined }) !== stable({ ...data, code: undefined })) {
      toUpdate.push({ code: r.word_id, data });
    }
  }

  for (let i = 0; i < toCreate.length; i += 500) {
    await prisma.word.createMany({
      data: toCreate.slice(i, i + 500) as never,
      skipDuplicates: true,
    });
  }
  for (let i = 0; i < toUpdate.length; i += 200) {
    await prisma.$transaction(
      toUpdate.slice(i, i + 200).map((u) => prisma.word.update({ where: { code: u.code }, data: u.data as never })),
    );
  }
  console.log(`Words created: ${toCreate.length}, updated: ${toUpdate.length}, total in sheet: ${rows.length}`);

  // The flashcard's "Record yourself for audit" needs an Exercise to attach
  // the Submission to. One hidden module holds it.
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
  const ex = await prisma.exercise.findFirst({ where: { moduleId: mod.id, title: WORD_PRACTICE_TITLE } });
  if (!ex) {
    await prisma.exercise.create({
      data: {
        moduleId: mod.id,
        title: WORD_PRACTICE_TITLE,
        prompt:
          "Say the word clearly, then use it in three sentences of your own about your day, your work or your studies.",
        expects: "AUDIO",
        minSeconds: 15,
        maxSeconds: 90,
      },
    });
  }
  console.log("System exercise ready.");
}

main().finally(() => prisma.$disconnect());
