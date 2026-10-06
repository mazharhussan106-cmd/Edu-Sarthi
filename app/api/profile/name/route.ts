// Owns changing the account's display name. Students who signed in with an
// email code start with no name at all, so the profile page asks for one.
//
// It deliberately does NOT touch email. Changing an email means re-verifying
// it, which is a flow of its own.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { nameSchema } from "@/lib/validations";

export async function PATCH(req: Request) {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Could not save your name. Try again." }, { status: 400 });
  }

  const parsed = nameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter your name." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { name: parsed.data.name } });
  return NextResponse.json({ ok: true });
}
