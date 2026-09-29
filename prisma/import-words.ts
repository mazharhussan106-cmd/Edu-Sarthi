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

async function main() {
  const rows = JSON.parse(readFileSync("content/wordmaster-2000/words.json", "utf8")) as Row[];

  let done = 0;
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    await prisma.$transaction(
      batch.map((r) => {
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
        return prisma.word.upsert({
          where: { code: r.word_id },
          create: { code: r.word_id, kind: "WORD", ...data },
          update: data,
        });
      }),
    );
    done += batch.length;
  }
  console.log(`Words imported or updated: ${done}`);

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
