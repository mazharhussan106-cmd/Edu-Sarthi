// Owns changing or removing the account's mobile number from the profile.
//
// The number is stored unverified, as at sign-up: no SMS is sent while
// SMS_ENABLED is off, and the privacy page says so. A changed number therefore
// clears phoneVerified, so a verification of the old number never vouches for
// the new one.
//
// It deliberately does NOT reveal whose account already holds a number; it
// only says the number is in use, as sign-up does for an email.

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { phoneSchema } from "@/lib/validations";

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
  try {
    await prisma.user.update({ where: { id: gate.id }, data: { phone, phoneVerified: null } });
  } catch (e) {
    // The column is unique: one number, one account.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "That number is already on another EduSarthi account. Use a different number, or leave it empty." }, { status: 409 });
    }
    throw e;
  }
  return NextResponse.json({ ok: true });
}
