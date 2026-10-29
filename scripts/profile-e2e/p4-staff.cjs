// Phase P4 checks: the teacher Profile (tiles, QA note with its audit, queue
// count equal to the Queue page, turnaround equal to Workload, no student
// names, honest download line), the admin Profile, the admin's QA-note
// warning (audit F1), and axe in every theme. Expects a fresh seed.

const { chromium, BASE, check, login, axe, done } = require("./lib.cjs");

const mainText = async (p) => {
  await p.waitForLoadState("networkidle");
  return p.locator("main").last().innerText();
};

(async () => {
  const b = await chromium.launch();
  const t = await login(b, "teacher");
  await t.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  const tiles = (await t.locator("section[aria-label='Your reviewing']").innerText()).replace(/\s+/g, " ");
  check("teacher tiles: 15 written, 2 students", /15 AUDITS WRITTEN/i.test(tiles) && /2 STUDENTS HELPED/i.test(tiles), tiles);
  check("verified chip", await t.getByText("Verified teacher").first().isVisible());
  check("QA note shown with its audit", (await t.getByText("Grammar score looks high for this recording", { exact: false }).isVisible()) && (await t.getByText(/“Say your name”, sent/).isVisible()));
  check("staff download line does not claim everything", await t.getByText("Your account details and settings, as a file").isVisible());
  const waiting = (await t.locator("main a[href='/queue']").innerText()).match(/(\d+) waiting/)?.[1];
  await t.goto(`${BASE}/queue`);
  check("queue count matches the Queue page", (await mainText(t)).includes(`${waiting} waiting`), `profile ${waiting}`);
  await t.goto(`${BASE}/profile`);
  check("no student name or email on the teacher profile", !(await mainText(t)).match(/Rahul|student@test|Other Student/));
  await t.goto(`${BASE}/workload?days=30`);
  const wl = (await mainText(t)).replace(/\s+/g, " ");
  await t.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  const tp = (await t.locator("section[aria-label='Your reviewing'] li").nth(3).innerText()).split("\n")[0].trim();
  const wlh = Number((wl.match(/([\d.]+)h Median turnaround|Median turnaround ([\d.]+)h/) || []).slice(1).find(Boolean));
  check("turnaround agrees with Workload 30 days", Math.round(wlh) === Number(tp.replace(/[^\d]/g, "")), `profile ${tp}, workload ${wlh}h`);
  await axe(t, "teacher profile");
  check("no page errors (teacher)", t.errors.length === 0, t.errors.join(" | "));
  await t.context().close();

  const a = await login(b, "admin");
  await a.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  check("admin recent actions in words", await a.getByText("Approved deck", { exact: true }).isVisible());
  check("admin sees decks waiting", /\d+\s*DECKS WAITING/i.test(await a.locator("section[aria-label='Your admin work']").innerText()));
  await axe(a, "admin profile");
  // Audited recordings are under "done" on Dispatch.
  await a.goto(`${BASE}/admin/dispatch?view=done`, { waitUntil: "networkidle" });
  const flag = a.getByRole("button", { name: "Flag for QA" }).first();
  if (await flag.count()) {
    await flag.click();
    check("QA form tells the admin the teacher sees the note", await a.getByText("The teacher who wrote this audit sees this note on their Profile.").first().isVisible());
  } else {
    check("QA form found on Dispatch", false, "no audited row to flag");
  }
  check("no page errors (admin)", a.errors.length === 0, a.errors.join(" | "));
  await a.context().close();
  await b.close();
  done();
})();
