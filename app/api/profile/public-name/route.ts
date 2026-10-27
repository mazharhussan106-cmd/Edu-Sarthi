// Owns changing how a creator's name shows on their public decks (Settings).
// The change applies to every public deck they have at once, by design: the
// credit is read from the account, not copied onto each deck.
//
// It deliberately does NOT send anything to review. A typed display name goes
// live at once (owner's decision); an admin can clear a bad one from Admin →
// Users. It also does not change the account name itself (/api/profile/name).

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { prisma } from "@/lib/prisma";
import { readJson } from "@/lib/decks";
import { publicNameSchema } from "@/lib/deckSchemas";

export const revalidate = 0;

export async function PATCH(req: Request) {
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;
  const userId = gate.id;

  const parsed = publicNameSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Choose how your name shows, then save again." }, { status: 400 });
  }
  const { creditStyle, publicName } = parsed.data;

  if (creditStyle === "FULL_NAME" || creditStyle === "FIRST_NAME") {
    const me = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    if (!me?.name?.trim()) {
      return NextResponse.json({ error: "Your account has no name yet. Add it on your Profile page, or choose a display name or no name." }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { creditStyle, ...(creditStyle === "DISPLAY_NAME" ? { publicName } : {}) },
  });
  return NextResponse.json({ ok: true });
}
