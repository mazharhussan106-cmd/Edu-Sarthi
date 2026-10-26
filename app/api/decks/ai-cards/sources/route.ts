// Owns adding and removing the PDFs and photos a person gives the AI card maker
// as sources. POST checks the file's type and size and returns a one-time
// upload address, so the file goes straight to storage and not through the app
// (a serverless request body is too small for a PDF). DELETE removes a file the
// person no longer wants to use.
//
// It deliberately does NOT read the file or call the model; the questions and
// make routes do, and delete the files once the cards exist.

import { NextResponse } from "next/server";

import { removeSourceSchema, sourceFileSchema } from "@/lib/aiCardSchemas";
import { deleteSources, registerSource } from "@/lib/aiSources";
import { requireUser } from "@/lib/apiUser";
import { readJson } from "@/lib/decks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;

  const parsed = sourceFileSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Could not add that file. Try again.", 400);

  // "application/pdf;charset=..." → "application/pdf": the list holds bare types.
  const contentType = parsed.data.contentType.split(";")[0].trim().toLowerCase();
  const res = await registerSource(gate.id, { ...parsed.data, contentType });
  return "error" in res ? fail(res.error, 400) : NextResponse.json({ ok: true, ...res });
}

export async function DELETE(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;

  const parsed = removeSourceSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail("Could not remove that file. Try again.", 400);

  // Scoped to the signed-in person inside deleteSources.
  await deleteSources(gate.id, [parsed.data.id]);
  return NextResponse.json({ ok: true });
}
