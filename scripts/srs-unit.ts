// Owns the checks for the spaced-repetition rules in lib/srs.ts and the
// practice-after-Unknown list in lib/cardAgain.ts: every rule in
// docs/SRS-V2-PLAN.md, run against fixed dates so the result never depends on
// when it runs. No database.
//
// Run: npx tsx scripts/srs-unit.ts   (exits 1 on the first failed check)

import assert from "node:assert/strict";

import { LADDER_DAYS, describeDue, istDayStart, nextReview, rungForGap } from "../lib/srs";
import { AGAIN_AFTER, afterCard, againQuery, parseAgain, pickForSession, pickWithAgain, type Again } from "../lib/cardAgain";

const DAY = 86_400_000;
// Monday 3 Nov 2026, 21:00 India time: late evening, the case where exact
// hours and calendar days disagree.
const MON_9PM = new Date("2026-11-03T15:30:00Z");
const MON_MIDNIGHT = istDayStart(MON_9PM);

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok  ${name}`);
}

/// Days from Monday's midnight to the due date, as the student counts them.
const dayOf = (d: Date) => Math.round((d.getTime() - MON_MIDNIGHT.getTime()) / DAY);
const at = (stage: number, daysAgo: number) => ({ stage, lastReviewedAt: new Date(MON_9PM.getTime() - daysAgo * DAY) });

check("ladder is 3 · 7 · 15 · 30 · 60 · 120 · 180", () => {
  assert.deepEqual([...LADDER_DAYS], [3, 7, 15, 30, 60, 120, 180]);
});

check("IST midnight of Monday 9 pm is Monday 00:00 IST", () => {
  assert.equal(MON_MIDNIGHT.toISOString(), "2026-11-02T18:30:00.000Z");
});

check("new card: Hard 3, Medium 7, Easy 15 days (D3)", () => {
  assert.equal(dayOf(nextReview(null, true, "HARD", "a", MON_9PM).dueAt), 3);
  assert.equal(dayOf(nextReview(null, true, "MEDIUM", "a", MON_9PM).dueAt), 7);
  assert.equal(nextReview(null, true, "EASY", "a", MON_9PM).stage, 2);
});

check("new card: no level counts as Medium", () => {
  assert.equal(nextReview(null, true, null, "a", MON_9PM).stage, 1);
});

check("new card Unknown: 3 days, never sooner (D1)", () => {
  const r = nextReview(null, false, null, "a", MON_9PM);
  assert.equal(r.stage, 0);
  assert.equal(dayOf(r.dueAt), 3);
});

check("due from midnight IST, not 72 hours after the tap (D6)", () => {
  const r = nextReview(null, false, null, "a", MON_9PM);
  // Thursday 00:00 IST, so a Thursday-morning session sees it.
  assert.equal(r.dueAt.toISOString(), "2026-11-05T18:30:00.000Z");
});

check("no answer ever comes back in under 3 days (D1)", () => {
  for (let stage = 0; stage < LADDER_DAYS.length; stage++) {
    for (const known of [true, false]) {
      for (const recall of ["HARD", "MEDIUM", "EASY", null] as const) {
        for (let k = 0; k < 20; k++) {
          const r = nextReview(at(stage, 0), known, known ? recall : null, `w${k}`, MON_9PM);
          assert.ok(dayOf(r.dueAt) >= 3, `stage ${stage} ${known} ${recall} → ${dayOf(r.dueAt)}`);
        }
      }
    }
  }
});

check("Unknown: two steps down (60 → 15, 7 → 3, 3 → 3) (D4)", () => {
  assert.equal(nextReview(at(4, 60), false, null, "a", MON_9PM).stage, 2);
  assert.equal(nextReview(at(1, 7), false, null, "a", MON_9PM).stage, 0);
  assert.equal(nextReview(at(0, 3), false, null, "a", MON_9PM).stage, 0);
});

check("Known on time: Hard +0, Medium +1, Easy +2", () => {
  assert.equal(nextReview(at(2, 15), true, "HARD", "a", MON_9PM).stage, 2);
  assert.equal(nextReview(at(2, 15), true, "MEDIUM", "a", MON_9PM).stage, 3);
  assert.equal(nextReview(at(2, 15), true, "EASY", "a", MON_9PM).stage, 4);
});

check("top rung is 180 and stays there", () => {
  const r = nextReview(at(6, 180), true, "EASY", "a", MON_9PM);
  assert.equal(r.stage, 6);
  assert.ok(Math.abs(dayOf(r.dueAt) - 180) <= 2);
});

check("late credit: due at 7, back on day 20, Medium → 30 (D9)", () => {
  assert.equal(LADDER_DAYS[nextReview(at(1, 20), true, "MEDIUM", "a", MON_9PM).stage], 30);
});

check("late credit: also on Easy, never lowers the normal step", () => {
  assert.equal(LADDER_DAYS[nextReview(at(1, 20), true, "EASY", "a", MON_9PM).stage], 30);
  assert.equal(LADDER_DAYS[nextReview(at(1, 8), true, "EASY", "a", MON_9PM).stage], 30);
});

check("late credit: not on Hard", () => {
  assert.equal(nextReview(at(1, 20), true, "HARD", "a", MON_9PM).stage, 1);
});

check("late credit: remembered longer than the ladder → top rung", () => {
  assert.equal(nextReview(at(0, 400), true, "MEDIUM", "a", MON_9PM).stage, 6);
});

check("a stage from an older, longer ladder is clamped, not out of range", () => {
  const r = nextReview(at(9, 0), true, "HARD", "a", MON_9PM);
  assert.equal(r.stage, 6);
});

check("spread: none under 15, ±1 at 15, ±2 from 30 (D8)", () => {
  const seen = new Map<number, Set<number>>();
  for (let k = 0; k < 300; k++) {
    for (let stage = 0; stage < LADDER_DAYS.length; stage++) {
      const r = nextReview(at(stage, 0), true, "HARD", `card${k}:3`, MON_9PM);
      const gap = LADDER_DAYS[stage];
      const off = dayOf(r.dueAt) - gap;
      if (!seen.has(gap)) seen.set(gap, new Set());
      seen.get(gap)!.add(off);
    }
  }
  assert.deepEqual([...seen.get(3)!], [0]);
  assert.deepEqual([...seen.get(7)!], [0]);
  assert.deepEqual([...seen.get(15)!].sort(), [-1, 0, 1]);
  for (const g of [30, 60, 120, 180]) assert.deepEqual([...seen.get(g)!].sort(), [-1, -2, 0, 1, 2]);
});

check("rung from gap: v1 gaps 1·3·7·15·30·60 → v2 rungs 0·0·1·2·3·4", () => {
  assert.deepEqual([1, 3, 7, 15, 30, 60].map(rungForGap), [0, 0, 1, 2, 3, 4]);
});

check("rung from gap: every v2 gap, with spread and time of day, maps to itself", () => {
  // A v2 gap is whole days from the answer's midnight, so dueAt − lastReviewedAt
  // is up to a day short of the rung (+ spread).
  for (let rung = 0; rung < LADDER_DAYS.length; rung++) {
    const range = LADDER_DAYS[rung] >= 30 ? 2 : LADDER_DAYS[rung] >= 15 ? 1 : 0;
    for (let off = -range; off <= range; off++) {
      for (const short of [0, 0.01, 0.5, 0.99]) assert.equal(rungForGap(LADDER_DAYS[rung] + off - short), rung, `${rung} ${off} ${short}`);
    }
  }
});

check("a v1 card answered before the restage script does not jump a rung (audit A2)", () => {
  // Stored as v1 step 5 (60 days), last answered 60 days ago, due today.
  const last = new Date(MON_9PM.getTime() - 60 * DAY);
  const v1 = { stage: 5, lastReviewedAt: last, dueAt: new Date(last.getTime() + 60 * DAY) };
  assert.equal(LADDER_DAYS[nextReview(v1, true, "MEDIUM", "a", MON_9PM).stage], 120);
  assert.equal(LADDER_DAYS[nextReview(v1, true, "HARD", "a", MON_9PM).stage], 60);
  assert.equal(LADDER_DAYS[nextReview(v1, false, null, "a", MON_9PM).stage], 15);
});

check("a v2 card's rung read from its gap equals its stored step", () => {
  for (let k = 0; k < 50; k++) {
    let cur: { stage: number; lastReviewedAt: Date | null; dueAt: Date | null } | null = null;
    let now = MON_9PM;
    for (const recall of ["MEDIUM", "EASY", "HARD", "MEDIUM", "MEDIUM", "EASY"] as const) {
      const r = nextReview(cur, true, recall, `k${k}:${recall}`, now);
      cur = { stage: r.stage, lastReviewedAt: now, dueAt: r.dueAt };
      assert.equal(rungForGap((r.dueAt.getTime() - now.getTime()) / DAY), r.stage);
      now = new Date(r.dueAt.getTime() + 9 * 3_600_000); // reviewed at 9 am on the due day
    }
  }
});

check("spread: the same answer always gives the same date", () => {
  const a = nextReview(at(3, 30), true, "MEDIUM", "word-x:4", MON_9PM).dueAt.getTime();
  const b = nextReview(at(3, 30), true, "MEDIUM", "word-x:4", MON_9PM).dueAt.getTime();
  assert.equal(a, b);
});

check("describeDue counts India-time days", () => {
  assert.equal(describeDue(new Date(MON_9PM.getTime() - 1), MON_9PM), "due now");
  assert.equal(describeDue(new Date(MON_MIDNIGHT.getTime() + DAY), MON_9PM), "tomorrow");
  assert.equal(describeDue(new Date(MON_MIDNIGHT.getTime() + 3 * DAY), MON_9PM), "in 3 days");
  // Monday 9 pm to Tuesday 8 pm is under 24 hours but still "tomorrow".
  assert.equal(describeDue(new Date(MON_9PM.getTime() + 23 * 3_600_000), MON_9PM), "tomorrow");
  // A card from before v2 due at 11 pm the same evening.
  assert.equal(describeDue(new Date(MON_9PM.getTime() + 2 * 3_600_000), MON_9PM), "later today");
});

// ---- practice after Unknown (D5) ----

check("again: Unknown comes round after 3 other cards, once", () => {
  let again: Again = [];
  again = afterCard(again, "A", true); // Unknown on A
  assert.deepEqual(again, [{ code: "A", wait: AGAIN_AFTER }]);
  again = afterCard(again, "B", false);
  again = afterCard(again, "C", true); // Unknown on C too
  again = afterCard(again, "D", false);
  // A has waited 3 cards (B, C, D); C only 1 so far (D).
  assert.deepEqual(again, [{ code: "A", wait: 0 }, { code: "C", wait: 2 }]);
  // A's practice look: whatever is pressed, it is not queued a second time.
  again = afterCard(again, "A", false);
  assert.deepEqual(again, [{ code: "C", wait: 1 }]);
  again = afterCard(again, "E", false);
  assert.deepEqual(again, [{ code: "C", wait: 0 }]);
});

check("again: survives the URL round trip, drops junk and repeats", () => {
  const q = againQuery([{ code: "VRB-001", wait: 2 }, { code: "PY-01-001", wait: 0 }]);
  assert.equal(q, "&again=VRB-001~2.PY-01-001~0");
  assert.deepEqual(parseAgain(q.slice("&again=".length)), [{ code: "VRB-001", wait: 2 }, { code: "PY-01-001", wait: 0 }]);
  assert.deepEqual(parseAgain("A1~9.<x>~1.A1~0.B2~x"), [{ code: "A1", wait: AGAIN_AFTER }]);
  assert.equal(againQuery([]), "");
});

check("again: capped at 10 cards", () => {
  let again: Again = [];
  for (let i = 0; i < 15; i++) again = afterCard(again, `C${i}`, true);
  assert.equal(again.length, 10);
});

async function picks() {
  const ids: Record<string, string> = { A: "id-a", C: "id-c", "VRB-001": "id-vrb" };
  let lookups = 0;
  const find = async (codes: string[]) => {
    lookups++;
    return new Map(codes.filter((c) => ids[c]).map((c) => [c, { id: ids[c], code: c }]));
  };
  const some = async () => "id-next";
  const none = async () => null;

  let r = await pickWithAgain([{ code: "A", wait: 0 }], some, find);
  assert.deepEqual([r.id, r.practice], ["id-a", true]);
  r = await pickWithAgain([{ code: "A", wait: 2 }], some, find);
  assert.deepEqual([r.id, r.practice], ["id-next", false]);
  // Nothing else left: the waiting one comes now rather than never.
  r = await pickWithAgain([{ code: "A", wait: 2 }], none, find);
  assert.deepEqual([r.id, r.practice], ["id-a", true]);
  // A card that is gone is dropped, and the session carries on.
  r = await pickWithAgain([{ code: "GONE", wait: 0 }, { code: "C", wait: 1 }], some, find);
  assert.deepEqual([r.id, r.practice, r.again], ["id-next", false, [{ code: "C", wait: 1 }]]);
  r = await pickWithAgain([], none, find);
  assert.deepEqual([r.id, r.practice], [null, false]);
  // Nothing left and the waiting card is gone: dropped, not kept in the URL (audit A6).
  r = await pickWithAgain([{ code: "GONE", wait: 2 }, { code: "A", wait: 3 }], none, find);
  assert.deepEqual([r.id, r.practice, r.again], ["id-a", true, [{ code: "A", wait: 3 }]]);
  // The practice card comes back as its row, so the page need not fetch it (audit B6).
  assert.deepEqual(r.row, { id: "id-a", code: "A" });
  // Ten waiting codes at the end of a session: one lookup, not ten (audit B5).
  lookups = 0;
  const ten = Array.from({ length: 9 }, (_, i) => ({ code: `GONE${i}`, wait: 2 })).concat({ code: "C", wait: 3 });
  r = await pickWithAgain(ten, none, find);
  assert.deepEqual([r.id, lookups, r.again], ["id-c", 1, [{ code: "C", wait: 3 }]]);
  // All gone: the list empties and the session ends.
  r = await pickWithAgain([{ code: "GONE", wait: 1 }], none, find);
  assert.deepEqual([r.id, r.again], [null, []]);

  // The shared page helper.
  let s = await pickForSession({ named: "id-named", inList: false, raw: "VRB-001~0", next: some, find });
  assert.deepEqual([s.id, s.practice, s.again], ["id-named", false, [{ code: "VRB-001", wait: 0 }]]);
  s = await pickForSession({ named: "id-named", inList: true, raw: "VRB-001~0", next: some, find });
  assert.deepEqual([s.id, s.practice, s.again], ["id-named", false, null]);
  s = await pickForSession({ named: null, inList: false, raw: "VRB-001~0", next: some, find });
  assert.deepEqual([s.id, s.practice, s.row], ["id-vrb", true, { id: "id-vrb", code: "VRB-001" }]);
  s = await pickForSession({ named: null, inList: false, raw: undefined, next: some, find });
  assert.deepEqual([s.id, s.practice, s.again], ["id-next", false, []]);
  passed++;
  console.log("ok  again: which card a session page shows");
}

picks().then(() => console.log(`\n${passed} checks passed`));
