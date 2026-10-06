// Owns issuing a signed upload URL for a card's picture or recording.
// Validates type and size first — once a URL exists the client can send what
// it likes, so every decision is made before it is handed over.
//
// It deliberately does NOT attach the file to a card. The upload may fail
// halfway; the card route re-checks that the file exists before saving a key.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { readJson } from "@/lib/decks";
import { DECK_LIMITS, mediaRequestSchema } from "@/lib/deckSchemas";
import { ALLOWED_TYPES, createUploadTarget } from "@/lib/storage";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  const parsed = mediaRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Could not start the upload. Try again.", 400);
  const { kind, filename, contentType, sizeBytes } = parsed.data;

  if (ALLOWED_TYPES[contentType] !== kind) {
    return fail(kind === "IMAGE" ? "Use a JPG, PNG or WebP picture." : "Use an audio file or record directly in the card.", 400);
  }
  const limit = kind === "IMAGE" ? DECK_LIMITS.imageBytes : DECK_LIMITS.audioBytes;
  if (sizeBytes > limit) {
    return fail(`That file is over ${limit / 1024 / 1024} MB. ${kind === "IMAGE" ? "Pick a smaller picture or shrink it first." : "Record a shorter clip."}`, 400);
  }

  try {
    return NextResponse.json(await createUploadTarget(userId, filename));
  } catch {
    return fail("Uploads are not working right now. Save the card without it and try again later.", 500);
  }
}
