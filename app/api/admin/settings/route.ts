// Owns changing the site-wide settings (lib/appSettings). Admins only, every
// change written to the admin log with the old and new value.
//
// It deliberately takes one setting at a time: today there is one, and a
// form that saves everything at once would log changes nobody made.

import { NextResponse } from "next/server";

import { logAdmin, readBody, requireAdmin } from "@/lib/admin";
import { auditsPerDaySchema } from "@/lib/appSettingSchemas";
import { getAuditsPerDay, setAuditsPerDay } from "@/lib/appSettings";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const parsed = auditsPerDaySchema.safeParse(await readBody(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a whole number." }, { status: 400 });
  }

  const before = await getAuditsPerDay();
  try {
    await setAuditsPerDay(parsed.data.auditsPerDay);
  } catch {
    // Almost always the AppSetting table not created yet on this database.
    return NextResponse.json(
      { error: "Could not save. If the site was just updated, run Actions → Database setup on GitHub once, then try again." },
      { status: 503 },
    );
  }
  await logAdmin(admin.id, "Changed recordings per student per day", "setting", "auditsPerDay", { from: before, to: parsed.data.auditsPerDay });
  return NextResponse.json({ ok: true });
}
