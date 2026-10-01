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

async function load(kind: CardKind, file: string) {
  const rows = JSON.parse(readFileSync(file, "utf8")) as Chunk[];

  let done = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    await prisma.$transaction(
      batch.map((r) => {
        const details = Object.fromEntries(Object.entries(r).filter(([k]) => !CORE.has(k)));
        const data = {
          text: r.text,
          serial: r.order_a,
          serialB: r.order_b,
          partOfSpeech: r.lewis_type,
          category: r.type,
          cefr: r.level,
          importance: null,
          details: details as object,
        };
        return prisma.word.upsert({
          where: { code: r.code },
          // Kind is updated too: a card moved between files (the grammar
          // split) changes tab but keeps the student's progress on it.
          create: { code: r.code, kind, ...data },
          update: { kind, ...data },
        });
      }),
    );
    done += batch.length;
  }
  console.log(`${kind} cards imported or updated: ${done}`);
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
