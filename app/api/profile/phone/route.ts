// Owns saving or removing the account's phone number from Settings. The number
// is optional and unverified: nothing signs in with it or sends to it yet
// (owner's decision N3: the field stays for later use).
//
// It deliberately does not say who else has a number. Phone is unique in the
// database, so a clash is answered with a message that names no account.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { phoneSchema } from "@/lib/accountSchemas";
import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const gate = await requireUser({ member: true });
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Could not save your number. Try again." }, { status: 400 });
  }
  const parsed = phoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a 10-digit mobile number, or leave it empty." }, { status: 400 });
  }

  const phone = parsed.data.phone || null;
  const current = await prisma.user.findUnique({ where: { id: gate.id }, select: { phone: true } });
  if (current?.phone === phone) return NextResponse.json({ ok: true, phone });
  const clash = "This number can't be saved. Check it, or leave it empty.";
  // Checked first so the common clash is a plain answer, not a database error
  // in the logs; the catch below still covers two people saving at once.
  if (phone && (await prisma.user.findUnique({ where: { phone }, select: { id: true } }))) {
    return NextResponse.json({ error: clash }, { status: 409 });
  }
  try {
    // A changed number is unproven again; phoneVerified is cleared with it.
    await prisma.user.update({ where: { id: gate.id }, data: { phone, phoneVerified: null } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: clash }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json({ ok: true, phone });
}
