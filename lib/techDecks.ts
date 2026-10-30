// Owns the Tech tab's content (owner's decision, 30 Oct: "all"): every tech
// deck the student can see — EduSarthi's own imported decks and anyone's
// approved library decks, plus their own decks, the ones they follow, the ones
// shared with them by name and their institute's — each sorted into a subject.
//
// What makes a deck "tech" is its tags or its title. EduSarthi's imported
// decks carry one broad tag each (prisma/import-decks.ts: programming, data,
// infrastructure, cloud and networking, artificial intelligence), so those
// tags are the subjects. A student's deck often has no tag, so the title is
// read too, but only for words that cannot mean something else in an English
// course: "excel", "data", "react", "java" and "cloud" count as tags, not in
// titles ("Excel at interviews" is not a spreadsheet deck). Words a business-
// English deck uses — networking, security, monitoring, logging, code — are
// left out altogether ("Networking at business events" is not a tech deck);
// the official decks are found by their tags instead.
//
// It reads the candidate decks and filters here, as lib/libraryTags does,
// because the matching is on words inside free-text tags and titles. The
// student's own, shared, followed and institute decks are read in full; the
// library is capped at its 1,000 most-copied decks, so a big library can never
// push the student's own decks off the page. At a few thousand public decks,
// move the matching into SQL.
// It deliberately does NOT widen who can see a deck: the query is the union
// of rules that already exist (LISTED, readable, followed, institute).

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { LISTED } from "@/lib/decks";
import { instituteDeckScope } from "@/lib/institutes";
import { CREDIT_SELECT, type CreditInstitute, type CreditOwner } from "@/lib/libraryTerms";

export const TECH_SUBJECTS = [
  {
    key: "programming",
    label: "Programming",
    words: ["programming", "coding", "python", "javascript", "typescript", "html", "css", "node.js", "nodejs", "react.js", "reactjs", "java programming", "git", "github", "api", "apis", "supabase"],
    tagOnly: ["react", "node", "java"],
  },
  { key: "data", label: "Data", words: ["sql", "power bi", "powerbi", "etl", "airflow", "jupyter", "pandas", "database", "databases", "analytics", "microsoft excel", "ms excel", "excel formulas"], tagOnly: ["data", "excel"] },
  { key: "infrastructure", label: "Infrastructure", words: ["linux", "bash", "shell scripting", "docker", "kubernetes", "k8s", "ci/cd", "cicd", "devops", "terraform"], tagOnly: ["infrastructure"] },
  {
    key: "cloud",
    label: "Cloud & networking",
    words: ["aws", "azure", "gcp", "sso", "oauth", "observability", "cloud computing", "computer networking", "computer networks", "network engineering", "cybersecurity", "cyber security", "tcp/ip"],
    tagOnly: ["cloud", "cloud and networking"],
  },
  { key: "ai", label: "AI", words: ["llm", "llms", "rag", "machine learning", "deep learning", "prompt engineering", "chatgpt", "genai", "generative ai", "artificial intelligence"], tagOnly: ["ai"] },
] as const;
export type TechSubject = (typeof TECH_SUBJECTS)[number]["key"];

export function isTechSubject(v: unknown): v is TechSubject {
  return TECH_SUBJECTS.some((s) => s.key === v);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
// Whole words only: "java" is not "javascript", "rag" is not "fragment".
const wordsRe = (list: readonly string[]) => new RegExp(`(?<![a-z0-9])(?:${list.map(escape).join("|")})(?![a-z0-9])`, "i");
const MATCHERS = TECH_SUBJECTS.map((s) => ({ key: s.key, title: wordsRe(s.words), tag: wordsRe([...s.words, ...s.tagOnly]) }));

/// The subjects a deck belongs to; empty for a deck that is not tech.
export function techSubjectsOf(d: { title: string; tags: string[] }): TechSubject[] {
  return MATCHERS.filter((m) => m.title.test(d.title) || d.tags.some((t) => m.tag.test(t))).map((m) => m.key);
}

export type TechDeck = {
  id: string;
  title: string;
  subjects: TechSubject[];
  cards: number;
  /// How the student has it: their own, shared with them, followed, their
  /// institute's, or just in the library.
  how: "own" | "shared" | "following" | "institute" | "library";
  href: string;
  due: number;
  available: boolean;
  owner: CreditOwner;
  /// Only for a public deck, as DeckCredit expects.
  institute: CreditInstitute | null;
};

const DECK_SELECT = (userId: string) =>
  ({
    id: true,
    title: true,
    tags: true,
    ownerId: true,
    visibility: true,
    status: true,
    instituteId: true,
    follows: { where: { userId }, select: { id: true } },
    members: { where: { userId, acceptedAt: { not: null } }, select: { id: true } },
    owner: { select: { ...CREDIT_SELECT, suspendedAt: true } },
    institute: { select: { name: true, logoKey: true, status: true } },
    _count: { select: { cards: true } },
  }) satisfies Prisma.DeckSelect;

export async function techDecks(userId: string): Promise<TechDeck[]> {
  const inst = await instituteDeckScope(userId);
  const select = DECK_SELECT(userId);
  // A new version's working copy is never shown; the live deck is.
  const personal = await prisma.deck.findMany({
    where: { draftOfId: null, OR: [{ ownerId: userId }, { members: { some: { userId, acceptedAt: { not: null } } } }, { follows: { some: { userId } } }, ...(inst ? [inst] : [])] },
    orderBy: { title: "asc" },
    select,
  });
  const library = await prisma.deck.findMany({
    where: { draftOfId: null, ...LISTED, id: { notIn: personal.map((d) => d.id) } },
    orderBy: [{ copyCount: "desc" }, { title: "asc" }],
    take: 1000,
    select,
  });
  const rows = [...personal, ...library];

  const tech = rows.flatMap((d) => {
    const subjects = techSubjectsOf(d);
    return subjects.length ? [{ d, subjects }] : [];
  });

  // Due per deck, for the decks the student studies: one read, however many.
  const dueRows = await prisma.cardState.findMany({
    where: { userId, reviews: { gt: 0 }, dueAt: { lte: new Date() }, word: { deckId: { in: tech.map((t) => t.d.id) } } },
    select: { word: { select: { deckId: true } } },
  });
  const due = new Map<string, number>();
  for (const r of dueRows) if (r.word.deckId) due.set(r.word.deckId, (due.get(r.word.deckId) ?? 0) + 1);

  return tech.map(({ d, subjects }) => {
    // The same test as lib/decks LISTED, on rows already loaded.
    const listed = d.visibility === "PUBLIC" && d.status === "APPROVED" && !d.owner.suspendedAt && d.institute?.status !== "SUSPENDED";
    const how: TechDeck["how"] =
      d.ownerId === userId ? "own" : d.members.length ? "shared" : d.follows.length ? "following" : inst && d.visibility === "INSTITUTE" && d.instituteId === inst.instituteId ? "institute" : "library";
    // "from=tech" keeps Tech as the current tab on the study page.
    const href =
      how === "own" || how === "shared" ? `/decks/${d.id}/study?from=tech` : how === "following" ? `/library/${d.id}/study?from=tech` : how === "institute" ? `/institute/decks/${d.id}` : `/library/${d.id}`;
    const owner: CreditOwner = { role: d.owner.role, name: d.owner.name, creditStyle: d.owner.creditStyle, publicName: d.owner.publicName };
    return {
      id: d.id,
      title: d.title,
      subjects,
      cards: d._count.cards,
      how,
      href,
      due: due.get(d.id) ?? 0,
      available: how !== "following" || listed,
      owner,
      institute: d.visibility === "PUBLIC" && d.institute ? { name: d.institute.name, logoKey: d.institute.logoKey } : null,
    };
  });
}
