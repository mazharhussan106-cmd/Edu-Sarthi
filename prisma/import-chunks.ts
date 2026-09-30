// Loads content/chunk-library/chunks.json into the Word table as kind CHUNK,
// and makes sure the hidden system exercise for "Record yourself" on a chunk
// card exists.
//
// Safe to run again after the workbook changes: rows are matched on the app
// code (the workbook ID, with PRP renamed PFR) and updated in place, so
// students' progress and any media added in the admin stay attached.
//
// Run with:  npx tsx prisma/import-chunks.ts
// Regenerate the JSON first if the Excel changed:
//            python content/chunk-library/tools/export_json.py

import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

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

// Must match CHUNK_PRACTICE_TITLE in lib/flashcards.ts.
const CHUNK_PRACTICE_TITLE = "Use the chunk in your own sentences";

async function main() {
  const rows = JSON.parse(readFileSync("content/chunk-library/chunks.json", "utf8")) as Chunk[];

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
          create: { code: r.code, kind: "CHUNK", ...data },
          update: data,
        });
      }),
    );
    done += batch.length;
  }
  console.log(`Chunks imported or updated: ${done}`);

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
  const ex = await prisma.exercise.findFirst({ where: { moduleId: mod.id, title: CHUNK_PRACTICE_TITLE } });
  if (!ex) {
    await prisma.exercise.create({
      data: {
        moduleId: mod.id,
        title: CHUNK_PRACTICE_TITLE,
        prompt:
          "Say the chunk clearly, then use it in three sentences of your own, the way you would say them in a real conversation.",
        expects: "AUDIO",
        minSeconds: 15,
        maxSeconds: 90,
      },
    });
  }
  console.log("Chunk exercise ready.");
}

main().finally(() => prisma.$disconnect());
