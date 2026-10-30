// Owns the Help page: the AI help box (when the AI is switched on), then plain
// answers to what a student actually asks, each one describing what the app
// does today. The answers live in lib/helpContent, which the AI reads too.
//
// It deliberately promises nothing that does not exist. There is no live chat
// with a person and no teacher messaging, so the page says where questions go
// (Support) and calls the help box what it is: an AI.

import Link from "next/link";

import { auth } from "@/lib/auth";
import { helpBotEnabled } from "@/lib/aiEnabled";
import { helpLeft } from "@/lib/aiHelpLimits";
import { FAQ } from "@/lib/helpContent";
import { prisma } from "@/lib/prisma";
import { Card, CardTitle } from "@/components/ui/Card";
import { HelpChat } from "@/components/help/HelpChat";

export const metadata = { title: "Help — EduSarthi" };
// The questions left today change with every question asked.
export const revalidate = 0;

async function questionsLeft(): Promise<number | null> {
  if (!helpBotEnabled()) return null;
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const me = await prisma.user.findUnique({ where: { id }, select: { isGuest: true } });
  return helpLeft(id, Boolean(me?.isGuest));
}

export default async function HelpPage() {
  const left = await questionsLeft();
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Help</h1>
      <p className="mt-1 text-sm text-ink-muted">Short answers about how EduSarthi works today.</p>

      {left !== null ? <HelpChat initialLeft={left} /> : null}

      <div className="mt-6 flex flex-col gap-3">
        {FAQ.map((f) => (
          <details key={f.q} className="group rounded-xl border border-border bg-surface p-4">
            <summary className="cursor-pointer list-none font-display text-sm font-bold text-ink marker:hidden">{f.q}</summary>
            <p className="mt-2 text-sm text-ink-muted">{f.a}</p>
          </details>
        ))}
      </div>

      <Card className="mt-6">
        <CardTitle>Still stuck?</CardTitle>
        <p className="mt-2 text-sm text-ink-muted">
          There is no live chat with a person. Write to us from the <Link href="/support" className="font-medium text-accent hover:underline">Support page</Link> and say which screen you were on. Questions about a specific audit are best answered by re-recording the exercise and comparing the two.
        </p>
      </Card>
    </main>
  );
}
