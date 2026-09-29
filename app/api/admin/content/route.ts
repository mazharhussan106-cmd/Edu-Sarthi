// Owns admin edits to the speaking curriculum (spec A-03): create, update and
// delete modules and exercises, and bulk-import exercises from CSV with a
// dry run that reports every bad row before anything is written.
//
// Deletion refuses anything a student has already submitted against. Those
// submissions and their audits are the student's record; the database would
// refuse anyway, and this says why in words an admin can act on.

import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { logAdmin, readBody, requireAdmin } from "@/lib/admin";
import { parseCsv } from "@/lib/csv";

const moduleFields = z.object({
  title: z.string().trim().min(3, "Module title is too short").max(120),
  description: z.string().trim().min(10, "Write a line describing the module").max(600),
  level: z.coerce.number().int().min(1, "Level starts at 1").max(10, "Level is 1 to 10"),
});

const exerciseFields = z
  .object({
    title: z.string().trim().min(3, "Exercise title is too short").max(160),
    prompt: z.string().trim().min(10, "The prompt tells the student what to do — write it out").max(2000),
    expects: z.enum(["AUDIO", "VIDEO", "IMAGE"], "Expects must be AUDIO, VIDEO or IMAGE"),
    minSeconds: z.coerce.number().int().min(0).max(3600).nullable().optional(),
    maxSeconds: z.coerce.number().int().min(1).max(3600).nullable().optional(),
  })
  .refine((e) => !e.minSeconds || !e.maxSeconds || e.minSeconds <= e.maxSeconds, {
    message: "Minimum seconds is above maximum",
  });

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("module.create"), data: moduleFields }),
  z.object({ action: z.literal("module.update"), id: z.string().min(1), data: moduleFields }),
  z.object({ action: z.literal("module.delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("exercise.create"), moduleId: z.string().min(1), data: exerciseFields }),
  z.object({ action: z.literal("exercise.update"), id: z.string().min(1), data: exerciseFields }),
  z.object({ action: z.literal("exercise.delete"), id: z.string().min(1) }),
  z.object({ action: z.literal("import"), csv: z.string().min(1).max(2_000_000), commit: z.boolean() }),
]);

const HEADER = ["module_title", "level", "module_description", "title", "prompt", "expects", "min_seconds", "max_seconds"];

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const parsed = schema.safeParse(await readBody(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  }
  const a = parsed.data;

  switch (a.action) {
    case "module.create": {
      const m = await prisma.module.create({ data: a.data, select: { id: true } });
      await logAdmin(admin.id, "Created module", "module", m.id, { title: a.data.title });
      return NextResponse.json({ ok: true });
    }
    case "module.update": {
      await prisma.module.update({ where: { id: a.id }, data: a.data });
      await logAdmin(admin.id, "Edited module", "module", a.id, { title: a.data.title });
      return NextResponse.json({ ok: true });
    }
    case "module.delete": {
      const used = await prisma.submission.count({ where: { exercise: { moduleId: a.id } } });
      if (used) {
        return NextResponse.json(
          { error: `Students have ${used} submission${used === 1 ? "" : "s"} in this module. Edit it instead of deleting.` },
          { status: 409 },
        );
      }
      await prisma.enrollment.deleteMany({ where: { moduleId: a.id } });
      await prisma.module.delete({ where: { id: a.id } });
      await logAdmin(admin.id, "Deleted module", "module", a.id);
      return NextResponse.json({ ok: true });
    }
    case "exercise.create": {
      const e = await prisma.exercise.create({ data: { ...a.data, moduleId: a.moduleId }, select: { id: true } });
      await logAdmin(admin.id, "Created exercise", "exercise", e.id, { title: a.data.title });
      return NextResponse.json({ ok: true });
    }
    case "exercise.update": {
      await prisma.exercise.update({ where: { id: a.id }, data: a.data });
      await logAdmin(admin.id, "Edited exercise", "exercise", a.id, { title: a.data.title });
      return NextResponse.json({ ok: true });
    }
    case "exercise.delete": {
      const used = await prisma.submission.count({ where: { exerciseId: a.id } });
      if (used) {
        return NextResponse.json(
          { error: `Students have ${used} submission${used === 1 ? "" : "s"} for this exercise. Edit it instead of deleting.` },
          { status: 409 },
        );
      }
      await prisma.exercise.delete({ where: { id: a.id } });
      await logAdmin(admin.id, "Deleted exercise", "exercise", a.id);
      return NextResponse.json({ ok: true });
    }
    case "import":
      return importCsv(admin.id, a.csv, a.commit);
  }
}

async function importCsv(adminId: string, csv: string, commit: boolean) {
  const rows = parseCsv(csv);
  const header = (rows.shift() ?? []).map((h) => h.trim().toLowerCase());
  const missing = HEADER.filter((h) => !header.includes(h));
  if (missing.length) {
    return NextResponse.json({ error: `The first row must name the columns. Missing: ${missing.join(", ")}.` }, { status: 400 });
  }
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? "").trim();

  const errors: string[] = [];
  const valid: { module: z.infer<typeof moduleFields>; exercise: z.infer<typeof exerciseFields> }[] = [];
  rows.forEach((r, i) => {
    // +2: row 1 is the header, and people count rows from 1.
    const line = i + 2;
    const m = moduleFields.safeParse({ title: col(r, "module_title"), description: col(r, "module_description"), level: col(r, "level") });
    const e = exerciseFields.safeParse({
      title: col(r, "title"),
      prompt: col(r, "prompt"),
      expects: col(r, "expects").toUpperCase(),
      minSeconds: col(r, "min_seconds") || null,
      maxSeconds: col(r, "max_seconds") || null,
    });
    if (!m.success) errors.push(`Row ${line}: ${m.error.issues[0]?.message}`);
    else if (!e.success) errors.push(`Row ${line}: ${e.error.issues[0]?.message}`);
    else valid.push({ module: m.data, exercise: e.data });
  });

  if (errors.length || !commit) {
    return NextResponse.json({ ok: errors.length === 0, rows: valid.length, errors: errors.slice(0, 50) });
  }

  // All or nothing: a half-imported sheet is harder to fix than a rejected one.
  await prisma.$transaction(
    async (tx) => {
      const byTitle = new Map<string, string>();
      for (const v of valid) {
        let moduleId = byTitle.get(v.module.title);
        if (!moduleId) {
          const found = await tx.module.findFirst({ where: { title: v.module.title }, select: { id: true } });
          moduleId = found?.id ?? (await tx.module.create({ data: v.module, select: { id: true } })).id;
          byTitle.set(v.module.title, moduleId);
        }
        await tx.exercise.create({ data: { ...v.exercise, moduleId } });
      }
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
  await logAdmin(adminId, "Imported exercises from CSV", "exercise", null, { rows: valid.length });
  return NextResponse.json({ ok: true, rows: valid.length, errors: [] });
}
