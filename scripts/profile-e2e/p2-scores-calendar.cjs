// Phase P2 checks: speaking scores (values, change, screen-reader words), the
// practice calendar (learning days by the dashboard's XP rule, a freeze day,
// week count per width, list sheet, empty states) and axe. Expects a fresh
// seed.

const { chromium, BASE, check, login, axe, done } = require("./lib.cjs");

const visibleWeeks = (p) =>
  p.evaluate(() => [...document.querySelectorAll("[aria-hidden='true'] > div.flex > div")].filter((d) => getComputedStyle(d).display !== "none").length);

(async () => {
  const b = await chromium.launch();
  const p = await login(b, "student");
  await p.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  const fluency = p.locator("li", { hasText: "Fluency" }).first();
  const text = (await fluency.innerText()).replace(/\s+/g, " ");
  // The dashboard's numbers: the mean of all 14 audits, and latest minus first.
  check("fluency shows 5.7 and up 3.0", text.includes("5.7") && text.includes("3.0"), text);
  check("screen readers hear 'up'", (await fluency.locator(".sr-only").innerText()).includes("up"));
  check("calendar squares hidden from screen readers", (await p.locator("[aria-hidden='true'] span[title]").count()) > 100);
  check("summary says 27 learning days", await p.getByText(/27\s*learning days in the last 12 months/).waitFor({ timeout: 10000 }).then(() => true, () => false));
  check("student sees the card-XP note", await p.getByText("Card XP counts from 26 Oct 2026.", { exact: false }).isVisible());
  check("phone shows 17 weeks", (await visibleWeeks(p)) === 17);
  await p.getByRole("button", { name: "View as list" }).click();
  const s = p.getByRole("dialog", { name: "Practice calendar" });
  await s.waitFor();
  // 27 days with XP, plus the day a freeze covered.
  check("list has 28 days", (await s.locator("li").count()) === 28);
  check("list names the freeze day", await s.getByText("Streak freeze used").isVisible());
  check("a card-only day counts its XP", await s.getByText("10 XP · 10 cards").first().isVisible());
  check("newest day first, with its recording", (await s.locator("li").first().innerText()).includes("recording"));
  await s.getByRole("button", { name: "Done" }).click();
  await axe(p, "profile with scores and calendar");
  await axe(p, "calendar list sheet", ["light", "dark"], async (q) => {
    await q.getByRole("button", { name: "View as list" }).click();
    await q.getByRole("dialog", { name: "Practice calendar" }).waitFor();
  });
  for (const [w, weeks] of [[820, 26], [1280, 53]]) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.reload({ waitUntil: "networkidle" });
    const n = await visibleWeeks(p);
    const wide = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    check(`${w}px shows ${weeks} weeks, no sideways scroll`, n === weeks && !wide, String(n));
  }
  check("no page errors", p.errors.length === 0, p.errors.join(" | "));
  await p.context().close();

  const n = await login(b, "new");
  await n.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  check("new: empty scores text", await n.getByText("Your five scores show here after your first audit.").isVisible());
  await n.getByRole("button", { name: "View as list" }).click();
  check("new: empty list text", await n.getByText("No learning days yet.").isVisible());
  check("new: no card-log note", !(await n.getByText("Card XP counts from 26 Oct 2026.", { exact: false }).isVisible()));
  await n.context().close();
  await b.close();
  done();
})();
