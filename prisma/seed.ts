// Owns the starter curriculum and one demo submission, so the review flow can
// be built and tested before any upload code exists.
//
// It deliberately does NOT create users. Accounts come from the real signup
// flow — a seeded user with a known password is a live credential that ends up
// in production the one time someone forgets to skip the seed.
//
// Safe to run twice: modules are skipped if any exist, and the demo submission
// is skipped if the student already has one.

import { PrismaClient, MediaKind } from "@prisma/client";

const prisma = new PrismaClient();

/// A file in /public, not a remote URL. The whole point of this stage is to
/// prove the review flow without the upload pipeline, and a third-party link
/// that rots turns "the player is broken" into a false alarm.
///
/// Record ten seconds on your phone, save it as public/sample.mp3.
const DEMO_MEDIA_URL = "/sample.mp3";
const DEMO_DURATION_SEC = 10;

const MODULES = [
  {
    level: 1,
    title: "Introducing yourself",
    description:
      "The sentences you will say more than any others — your name, your work, where you are from.",
    exercises: [
      {
        title: "Say your name and what you do",
        prompt:
          "Speak for 30 to 60 seconds. Say your name, where you are from, and what you study or do for work. Speak as if meeting someone for the first time.",
        expects: MediaKind.AUDIO,
        minSeconds: 30,
        maxSeconds: 60,
      },
      {
        title: "Describe where you live",
        prompt:
          "Speak for 45 to 90 seconds about the place you live. What is nearby, what you like about it, and one thing you would change.",
        expects: MediaKind.AUDIO,
        minSeconds: 45,
        maxSeconds: 90,
      },
    ],
  },
  {
    level: 2,
    title: "Explaining something you know",
    description:
      "Holding a longer turn without losing the thread — the skill interviews actually test.",
    exercises: [
      {
        title: "Explain how something works",
        prompt:
          "Pick something you understand well — a process at work, a game, a recipe. Explain it in 60 to 120 seconds so that someone who has never seen it could follow.",
        expects: MediaKind.AUDIO,
        minSeconds: 60,
        maxSeconds: 120,
      },
      {
        title: "Give your opinion and one reason against it",
        prompt:
          "State an opinion you hold, then give the strongest argument someone might make against it. 60 to 120 seconds.",
        expects: MediaKind.AUDIO,
        minSeconds: 60,
        maxSeconds: 120,
      },
    ],
  },
  {
    level: 3,
    title: "Reading aloud and writing",
    description:
      "Pronunciation under a fixed text, and written work checked by the same teacher.",
    exercises: [
      {
        title: "Read a passage aloud",
        prompt:
          "Read any three paragraphs from a newspaper or a book at a natural pace. Do not rush to finish — read as if someone is listening.",
        expects: MediaKind.AUDIO,
        minSeconds: 45,
        maxSeconds: 120,
      },
      {
        title: "Photograph a page of your writing",
        prompt:
          "Write half a page by hand about your week, then photograph it. Make sure the whole page is in frame and the light is even.",
        expects: MediaKind.IMAGE,
        minSeconds: null,
        maxSeconds: null,
      },
    ],
  },
] as const;

async function main() {
  // Curriculum modules only: the hidden system modules (flashcard practice) are
  // created by the importers and must not make the seed think it already ran.
  const existing = await prisma.module.count({ where: { isSystem: false } });

  if (existing > 0) {
    console.log(`Modules already present (${existing}) — skipping curriculum.`);
  } else {
    for (const mod of MODULES) {
      await prisma.module.create({
        data: {
          level: mod.level,
          title: mod.title,
          description: mod.description,
          exercises: { create: mod.exercises.map((e) => ({ ...e })) },
        },
      });
    }
    console.log(`Created ${MODULES.length} modules.`);
  }

  // The demo recording is for building the review screens on a laptop. It is
  // OFF unless SEED_DEMO=1: the "Database setup" button runs this seed against
  // the live database, where the oldest student account is a real person and a
  // fake recording would land in the real teacher queue.
  if (process.env.SEED_DEMO !== "1") {
    console.log("Demo submission skipped (set SEED_DEMO=1 on a laptop to add it).");
    return;
  }

  // The demo submission needs a real student, which means signing up first.
  // Not an error — the curriculum alone is useful.
  const student = await prisma.user.findFirst({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true },
  });

  if (!student) {
    console.log("No student account yet — register one, then run the seed again.");
    return;
  }

  const alreadyHasOne = await prisma.submission.findFirst({
    where: { studentId: student.id },
    select: { id: true },
  });

  if (alreadyHasOne) {
    console.log("Demo submission already exists — skipping.");
    return;
  }

  const exercise = await prisma.exercise.findFirst({
    where: { expects: MediaKind.AUDIO },
    orderBy: { title: "asc" },
    select: { id: true },
  });

  if (!exercise) {
    console.log("No audio exercise found — cannot create the demo submission.");
    return;
  }

  await prisma.submission.create({
    data: {
      studentId: student.id,
      exerciseId: exercise.id,
      mediaUrl: DEMO_MEDIA_URL,
      mediaKind: MediaKind.AUDIO,
      durationSec: DEMO_DURATION_SEC,
      status: "PENDING",
    },
  });

  console.log(`Created a PENDING demo submission for ${student.email}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
