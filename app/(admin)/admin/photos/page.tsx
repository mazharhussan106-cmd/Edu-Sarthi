// Owns the admin's list of teachers' photos waiting to be checked. A teacher's
// photo is shown to students (many of them under 18) only after it is approved
// here; a refusal deletes the photo and tells the teacher why.
//
// Students' photos never appear: only the student sees their own, so there is
// nothing to check (owner's decision N9).

import { ensureActiveUser } from "@/lib/activeUser";
import { photosToCheck } from "@/lib/avatar";
import { displayId } from "@/lib/publicId";
import { ActionButton } from "@/components/admin/ActionButton";
import { Card } from "@/components/ui/Card";

export const revalidate = 0;

export default async function PhotosPage() {
  await ensureActiveUser(["ADMIN"]);
  const photos = await photosToCheck();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Teacher photos to check ({photos.length})</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Students see a teacher’s photo on their audits once you approve it. Approve only a clear, decent photo of the teacher: no other person, no logo or brand, nothing a parent would object to.
      </p>
      <ul className="mt-6 flex flex-col gap-2">
        {photos.length === 0 ? (
          <li>
            <Card className="text-sm text-ink-muted">No photos waiting.</Card>
          </li>
        ) : null}
        {photos.map((p) => (
          <li key={p.id}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.url ? <img src={p.url} alt={`Photo uploaded by ${p.name ?? "a teacher"}`} className="size-20 rounded-full border border-border bg-surface object-cover" /> : <span className="text-xs text-error">The file could not be loaded. Refuse it and ask for a new one.</span>}
                <span>
                  <span className="block font-medium text-ink">{p.name ?? "Unnamed teacher"}</span>
                  <span className="block font-mono text-xs text-ink-muted">{displayId(p.publicId)}</span>
                </span>
              </span>
              <span className="flex flex-wrap gap-2">
                <ActionButton url="/api/admin/photos" body={{ action: "refuse", id: p.id, key: p.avatarKey }} label="Refuse" askReason />
                <ActionButton url="/api/admin/photos" body={{ action: "approve", id: p.id, key: p.avatarKey }} label="Approve photo" variant="primary" />
              </span>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
}
