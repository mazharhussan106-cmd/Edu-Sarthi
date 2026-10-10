// Owns reading the signed-in account's saved display settings on the server and
// handing them to PrefSync. One primary-key read per page, the same cost as the
// layouts' existing account check.

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prefsOf } from "@/lib/preferences";
import { PrefSync } from "@/components/layout/PrefSync";

export async function PrefSyncServer() {
  const id = (await auth())?.user?.id;
  if (!id) return null;
  const row = await prisma.user.findUnique({ where: { id }, select: { preferences: true } });
  const p = prefsOf(row?.preferences);
  return <PrefSync prefs={{ textSize: p.textSize, hideHindi: p.hideHindi, dataSaver: p.dataSaver }} />;
}
