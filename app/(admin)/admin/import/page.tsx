// Owns the admin's Excel import page: turn a 56-point flashcard workbook into a
// published deck in the library. The steps and what the file must contain are
// spelled out here so an admin never needs the spec open beside it.
//
// It deliberately does NOT show past imports; each import is an entry in the
// admin log, and the deck itself is in the library.

import { ensureActiveUser } from "@/lib/activeUser";
import { Card } from "@/components/ui/Card";
import { XlsxImport } from "@/components/admin/XlsxImport";

export const revalidate = 0;

export default async function AdminImportPage() {
  await ensureActiveUser(["ADMIN"]);
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Import flashcards from Excel</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Upload a 56-point flashcard workbook (Python, SQL or any subject) and it becomes a deck in the library, with full three-side cards.
      </p>
      <Card className="mt-6">
        <XlsxImport />
      </Card>
      <Card className="mt-4 text-sm text-ink-muted">
        <h2 className="font-display text-base font-bold text-ink">What the file needs</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>A sheet whose heading row starts with <b>ID</b>, with columns such as Concept, Meaning, MCQ question, MCQ options and MCQ answer. Both the older Python layout and the newer two-row layout work.</li>
          <li>Every card needs its own ID (like PY-01-001). Upload the same deck name again and cards with the same ID are updated, new IDs are added, nothing is deleted — students keep their progress.</li>
          <li>Code in the sheet is shown to learners, never run by the site.</li>
          <li>Sheets such as Card View, Anki and Summary are skipped on their own.</li>
        </ul>
      </Card>
    </main>
  );
}
