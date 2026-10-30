// Owns the checks on how a deck's title and tags are read as tech subjects
// (lib/techDecks): whole words only, and the words that mean something else in
// an English course counted from tags, never from titles.
//
// It deliberately needs no database or browser. Run with:
//   npx tsx scripts/flashcard-tabs-e2e/subjects.ts

import { techSubjectsOf } from "../../lib/techDecks";

const cases: [string, string[], string[]][] = [
  // title, tags, expected subjects
  ["SQL basics", [], ["data"]],
  ["Excel at interviews", [], []],
  ["Microsoft Excel", ["data"], ["data"]],
  ["My spreadsheet deck", ["excel"], ["data"]],
  // "java" only as a tag: "Java island trip" is a travel deck.
  ["Java basics", [], []],
  ["Java basics", ["java"], ["programming"]],
  ["Java island trip", [], []],
  ["JavaScript and TypeScript", [], ["programming"]],
  ["Fragments in spoken English", [], []],
  ["RAG pipelines", [], ["ai"]],
  ["Cloud nine and other idioms", [], []],
  ["Cloud Basics", ["cloud and networking"], ["cloud"]],
  ["How to react politely", [], []],
  ["Docker", ["infrastructure"], ["infrastructure"]],
  ["CI/CD", [], ["infrastructure"]],
  ["Node.js tips", [], ["programming"]],
  ["Daily chunks", ["speaking"], []],
  ["LLM notes", ["ai"], ["ai"]],
  ["Python for data analytics", [], ["programming", "data"]],
  // Business English words that also name tech topics are never tech on their own.
  ["Networking at business events", [], []],
  ["Small talk for networking", ["business"], []],
  ["Airport vocabulary", ["travel", "security"], []],
  ["Monitoring your progress", ["monitoring"], []],
  ["Office English", ["network"], []],
  ["Dress code words", ["code"], []],
  ["Networking Basics", ["cloud and networking"], ["cloud"]],
  ["Computer networking", [], ["cloud"]],
  ["Cybersecurity basics", [], ["cloud"]],
];

let fails = 0;
for (const [title, tags, want] of cases) {
  const got = techSubjectsOf({ title, tags });
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"} "${title}" [${tags.join(", ")}] → ${JSON.stringify(got)}${ok ? "" : `, wanted ${JSON.stringify(want)}`}`);
}
console.log(fails ? `\n${fails} FAILED` : "\nALL PASSED");
process.exitCode = fails ? 1 : 0;
