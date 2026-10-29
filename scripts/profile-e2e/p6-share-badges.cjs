// Phase P6 checks: the 17 badges (the dashboard's list) and their hints, and the Share progress
// sheet (preview drawn, switches redraw it, photo off by default and drawn
// without error, a 1080 × 1350 PNG download, a new student's switches) with
// axe. Expects a fresh seed.

const fs = require("fs");
const os = require("os");
const path = require("path");

const { chromium, BASE, FIXTURES, check, login, axe, done } = require("./lib.cjs");

(async () => {
  const b = await chromium.launch();
  const p = await login(b, "student");
  await p.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Edit profile" }).click();
  await p.getByRole("dialog").locator("input[type=file]").setInputFiles(path.join(FIXTURES, "photo-gps.jpg"));
  await p.getByRole("dialog", { name: "Move and zoom" }).getByRole("button", { name: "Use photo" }).click();
  await p.getByRole("dialog", { name: "Edit profile" }).waitFor();
  await p.waitForTimeout(800);
  await p.keyboard.press("Escape");
  await p.reload({ waitUntil: "networkidle" });

  check("badges: 12 of 17", await p.getByText("12 of 17").isVisible());
  await p.getByRole("button", { name: /see all 17/ }).click();
  const bs = p.getByRole("dialog", { name: "Badges" });
  check("new badges listed", (await bs.getByText("Goal set").isVisible()) && (await bs.getByText("Score up").isVisible()) && (await bs.getByText("Shared a deck").isVisible()) && (await bs.getByText("Learn 30 days in a row").isVisible()) && (await bs.getByText("Earn 100 XP in one day").isVisible()));
  await bs.getByRole("button", { name: "Done" }).click();

  await p.getByRole("button", { name: "Share progress" }).click();
  const s = p.getByRole("dialog", { name: "Share my progress" });
  await s.waitFor();
  await p.waitForTimeout(800);
  const hash = () =>
    p.evaluate(() => {
      const c = document.querySelector("dialog[open] canvas");
      const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 997) h = (h * 31 + d[i]) >>> 0;
      return h;
    });
  const h1 = await hash();
  check("preview drawn", h1 !== 0);
  check("photo switch starts off", (await s.getByRole("switch", { name: "Photo" }).getAttribute("aria-checked")) === "false");
  await s.getByRole("switch", { name: "Streak" }).click();
  await p.waitForTimeout(300);
  check("switching streak off redraws", (await hash()) !== h1);
  await s.getByRole("switch", { name: "Streak" }).click();
  await s.getByRole("switch", { name: "Photo" }).click();
  await p.waitForTimeout(1200);
  check("photo switch on draws the photo", (await hash()) !== h1);
  check("no error shown", (await s.getByRole("alert").count()) === 0);
  const [dl] = await Promise.all([p.waitForEvent("download"), s.getByRole("button", { name: "Download" }).click()]);
  const out = path.join(os.tmpdir(), "profile-e2e-share.png");
  await dl.saveAs(out);
  const png = fs.readFileSync(out);
  check("download is a 1080 × 1350 PNG", dl.suggestedFilename() === "my-edusarthi-progress.png" && png.subarray(1, 4).toString() === "PNG" && png.readUInt32BE(16) === 1080 && png.readUInt32BE(20) === 1350);
  await axe(p, "share sheet", ["light", "dark"], async (q) => {
    await q.getByRole("button", { name: "Share progress" }).click();
    await q.getByRole("dialog", { name: "Share my progress" }).waitFor();
  });
  check("no page errors", p.errors.length === 0, p.errors.join(" | "));
  await p.context().close();

  const n = await login(b, "new");
  await n.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await n.getByRole("button", { name: "Share progress" }).click();
  const ns = n.getByRole("dialog", { name: "Share my progress" });
  await ns.waitFor();
  check("new: no name, photo or skill switch", (await ns.getByRole("switch", { name: /First name|Photo|Best skill change/ }).count()) === 0);
  await n.context().close();
  await b.close();
  done();
})();
