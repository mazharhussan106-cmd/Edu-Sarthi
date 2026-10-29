// Phase P3 checks: the goal's target date (days left, saved across a reload,
// refused by the server when past or impossible, "today" wording, a passed
// date, clearing it) and axe on the sheet. Expects a fresh seed.

const { PrismaClient } = require("@prisma/client");

const { chromium, BASE, check, login, axe, done } = require("./lib.cjs");

const isoIn = (d) => new Date(Date.now() + 5.5 * 3_600_000 + d * 86_400_000).toISOString().slice(0, 10);
const patch = (p, body) =>
  p.evaluate(async (b) => {
    const r = await fetch("/api/profile/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
    return [r.status, await r.text()];
  }, body);

(async () => {
  const b = await chromium.launch();
  const p = await login(b, "student");
  await p.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  const card = p.locator("#my-goal");
  const dateCell = () => card.locator("dd").nth(2).innerText();
  check("no date: Not set", (await dateCell()) === "Not set");
  const g = p.getByRole("dialog", { name: "My goal" });
  const pick = async (iso) => {
    await p.getByRole("button", { name: "Edit my goal" }).click();
    await g.waitFor();
    await g.getByLabel("Target date (optional)").fill(iso);
    await p.waitForTimeout(700);
    await g.getByRole("button", { name: "Done" }).click();
    await g.waitFor({ state: "hidden" });
    await p.waitForTimeout(800);
  };
  await pick(isoIn(78));
  check("78 days left shown", (await card.innerText()).includes("78 days left"), await dateCell());
  await p.reload({ waitUntil: "networkidle" });
  check("date survives reload", (await card.innerText()).includes("78 days left"));
  const past = await patch(p, { goalDate: "2020-01-01" });
  check("server refuses a past date with a reason", past[0] === 400 && past[1].includes("today or a later date"), past.join(" "));
  check("server refuses 31 Feb", (await patch(p, { goalDate: "2027-02-31" }))[0] === 400);
  await pick(isoIn(0));
  check("today wording", (await card.innerText()).includes("Today. All the best!"));
  await axe(p, "goal sheet with date", ["light", "dark"], async (q) => {
    await q.getByRole("button", { name: "Edit my goal" }).click();
    await q.getByRole("dialog", { name: "My goal" }).waitFor();
  });
  // A date that has passed can only be stored before it passes, so it is
  // written straight to the database here.
  const db = new PrismaClient();
  await db.$executeRaw`UPDATE "User" SET preferences = preferences || ${JSON.stringify({ goalDate: isoIn(-5) })}::jsonb WHERE email = 'student@test.local'`;
  await db.$disconnect();
  await p.reload({ waitUntil: "networkidle" });
  check("a passed date says so", (await card.innerText()).includes("This day has passed. Set your next one."));
  await p.getByRole("button", { name: "Edit my goal" }).click();
  await g.waitFor();
  await g.getByRole("button", { name: "Clear" }).click();
  await p.waitForTimeout(700);
  await g.getByRole("button", { name: "Done" }).click();
  await g.waitFor({ state: "hidden" });
  await p.waitForTimeout(800);
  check("cleared back to Not set", (await dateCell()) === "Not set");
  check("no page errors", p.errors.length === 0, p.errors.join(" | "));
  await p.context().close();
  await b.close();
  done();
})();
