// Owns the content page (spec A-03) for the speaking curriculum: modules with
// their exercises, inline edit and delete, and the CSV importer.
//
// WordMaster, Chunks and Sentence Frames are shown as pending. Their card
// format is being redesigned, and building a 56-column editor for a shape
// that is about to change would be work thrown away.

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { ActionButton } from "@/components/admin/ActionButton";
import { ExerciseForm, ModuleForm } from "@/components/admin/ContentForms";
import { CsvImport } from "@/components/admin/CsvImport";
import { ensureActiveUser } from "@/lib/activeUser";

export const revalidate = 0;

export default async function ContentPage() {
  // Re-checked in the page itself: a layout is not re-run on a client-side
  // navigation, and the role in the token can be older than a demotion.
  await ensureActiveUser(["ADMIN"]);
  const modules = await prisma.module.findMany({
    orderBy: [{ level: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      level: true,
      exercises: {
        orderBy: { title: "asc" },
        select: {
          id: true,
          title: true,
          prompt: true,
          expects: true,
          minSeconds: true,
          maxSeconds: true,
          _count: { select: { submissions: true } },
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Content</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {modules.length} modules · {modules.reduce((t, m) => t + m.exercises.length, 0)} exercises
          </p>
        </div>
        <ModuleForm label="+ New module" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant="accent">Speaking modules</Badge>
        {["WordMaster", "Chunks", "Sentence Frames"].map((t) => (
          <Badge key={t} title="Editor arrives once the card format is final">
            {t} · format pending
          </Badge>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {modules.map((m) => (
          <Card key={m.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="accent">Level {m.level}</Badge>
                  <CardTitle>{m.title}</CardTitle>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{m.description}</p>
              </div>
              <div className="flex flex-wrap items-start gap-1">
                <ModuleForm label="Edit" initial={{ id: m.id, title: m.title, description: m.description, level: m.level }} />
                <ActionButton
                  url="/api/admin/content"
                  body={{ action: "module.delete", id: m.id }}
                  label="Delete"
                  variant="ghost"
                  confirmWord="DELETE"
                />
              </div>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-ink-muted">
                  <th className="py-2 font-medium">Exercise</th>
                  <th className="py-2 font-medium">Expects</th>
                  <th className="py-2 font-medium">Seconds</th>
                  <th className="py-2 font-medium">Submissions</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {m.exercises.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="py-2 pr-3">
                      <p className="text-ink">{e.title}</p>
                      <p className="line-clamp-1 text-xs text-ink-muted">{e.prompt}</p>
                    </td>
                    <td className="py-2 text-xs text-ink-muted">{e.expects.toLowerCase()}</td>
                    <td className="py-2 font-mono text-xs text-ink-muted">
                      {e.minSeconds ?? "—"}–{e.maxSeconds ?? "—"}
                    </td>
                    <td className="py-2 font-mono text-xs text-ink-muted">{e._count.submissions}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap justify-end gap-1">
                        <ExerciseForm
                          moduleId={m.id}
                          label="Edit"
                          initial={{
                            id: e.id,
                            title: e.title,
                            prompt: e.prompt,
                            expects: e.expects,
                            minSeconds: e.minSeconds,
                            maxSeconds: e.maxSeconds,
                          }}
                        />
                        {e._count.submissions === 0 ? (
                          <ActionButton
                            url="/api/admin/content"
                            body={{ action: "exercise.delete", id: e.id }}
                            label="Delete"
                            variant="ghost"
                            confirmWord="DELETE"
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2">
              <ExerciseForm moduleId={m.id} label="+ Add exercise" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardTitle>Bulk import exercises</CardTitle>
        <div className="mt-3">
          <CsvImport />
        </div>
      </Card>
    </main>
  );
}
