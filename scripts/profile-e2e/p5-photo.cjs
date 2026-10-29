// Phase P5 checks, with the local file store (.dev-uploads): pick a wrong file,
// crop by keyboard with focus where it should be (audit F2), the stored file
// is 512 × 512 WebP with no camera data, replacing deletes the old file, the
// export has a link, someone else's key and an oversized file are refused
// (audit F6), guests get no photo, no teacher or admin page carries the key,
// removing and deleting the account delete the file. Expects a fresh seed.

const fs = require("fs");
const path = require("path");

const { chromium, BASE, ROOT, FIXTURES, check, login, axe, done } = require("./lib.cjs");

const UP = path.join(ROOT, ".dev-uploads");
const PHOTO = path.join(FIXTURES, "photo-gps.jpg");
const photos = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /photo\.(webp|jpg)$/.test(f)) : []);
const userId = (p) => p.evaluate(async () => JSON.parse(await (await fetch("/api/auth/session")).text()).user.id);
const focusName = (p) =>
  p.evaluate(() => {
    const a = document.activeElement;
    return !a || a === document.body ? "body" : `${a.tagName} ${a.getAttribute("aria-label") || a.closest("label")?.textContent || a.textContent || ""}`.slice(0, 60);
  });
const post = (p, body) =>
  p.evaluate(async (b) => (await fetch("/api/profile/avatar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) })).status, body);

async function addPhoto(p) {
  await p.getByRole("dialog", { name: "Edit profile" }).locator("input[type=file]").setInputFiles(PHOTO);
  const crop = p.getByRole("dialog", { name: "Move and zoom" });
  await crop.waitFor();
  return crop;
}

(async () => {
  const b = await chromium.launch();
  const p = await login(b, "student");
  await p.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  const dir = path.join(UP, await userId(p));
  const before = photos(dir);

  await p.getByRole("button", { name: "Edit profile" }).click();
  const sheet = p.getByRole("dialog", { name: "Edit profile" });
  await sheet.waitFor();
  check("photo section in sheet", await sheet.getByText("Add a photo").isVisible());
  await sheet.locator("input[type=file]").setInputFiles(path.join(FIXTURES, "not-a-photo.gif"));
  check("wrong type refused before upload", await sheet.getByRole("alert").getByText("Choose a JPG, PNG or WebP photo.").isVisible());
  const crop = await addPhoto(p);
  check("crop step replaces the form", !(await p.locator("#profile-name").isVisible()));
  check("focus lands on the crop area", /^CANVAS/.test(await focusName(p)), await focusName(p));
  await p.keyboard.press("ArrowRight");
  await p.keyboard.press("Shift+ArrowLeft");
  await crop.getByLabel("Zoom").fill("1.6");
  await crop.getByRole("button", { name: "Use photo" }).click();
  await sheet.waitFor();
  await p.waitForTimeout(1200);
  check("focus returns to the photo button", /INPUT.*(Change|Add)/.test(await focusName(p)), await focusName(p));
  check("photo shows on the identity card", await p.locator("main img[alt='Your profile photo']").first().isVisible());
  const fresh = photos(dir).filter((f) => !before.includes(f));
  check("one new file stored", fresh.length === 1, fresh.join(","));
  const bytes = fs.readFileSync(path.join(dir, fresh[0]));
  check("stored file is WebP with no camera data", bytes.subarray(0, 4).toString() === "RIFF" && !bytes.includes("TestPhone") && !bytes.includes("TestCam") && !bytes.includes("GPS"));
  await addPhoto(p).then((c) => c.getByRole("button", { name: "Back" }).click());
  check("Back returns focus to the photo button", /INPUT/.test(await focusName(p)), await focusName(p));
  await (await addPhoto(p)).getByRole("button", { name: "Use photo" }).click();
  await sheet.waitFor();
  await p.waitForTimeout(1200);
  const after = photos(dir);
  check("replacing deletes the old file", !after.includes(fresh[0]) && after.length === before.length + 1, after.join(","));
  await p.keyboard.press("Escape");

  const exp = await p.evaluate(async () => JSON.parse(await (await fetch("/api/me")).text()));
  check("export has a photo link", Boolean(exp.account.profilePhoto?.link));
  check("someone else's key refused", (await post(p, { action: "save", key: "someoneelse/11111111-1111-1111-1111-111111111111-photo.webp" })) === 400);
  // A file larger than a cropped photo, sent past the browser's own checks.
  const target = await p.evaluate(async () => JSON.parse(await (await fetch("/api/profile/avatar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upload", contentType: "image/webp", sizeBytes: 1000 }) })).text()));
  await p.evaluate(async (url) => (await fetch(url, { method: "PUT", headers: { "Content-Type": "image/webp" }, body: new Uint8Array(900 * 1024) })).status, target.url);
  check("oversized upload refused on save", (await post(p, { action: "save", key: target.key })) === 400);
  check("oversized file deleted", !fs.existsSync(path.join(UP, target.key)));
  const key = photos(dir).find((f) => !before.includes(f));
  await p.context().close();

  for (const [who, urls] of [["teacher", ["/queue", "/students", "/students/STU-7K3Q9P", "/students/STU-7K3Q9P/history"]], ["admin", ["/admin", "/admin/users", "/admin/dispatch"]]]) {
    const q = await login(b, who);
    const leaked = [];
    for (const u of urls) {
      await q.goto(`${BASE}${u}`, { waitUntil: "networkidle" });
      if ((await q.content()).includes(key)) leaked.push(u);
    }
    check(`${who} pages never carry the student's photo`, leaked.length === 0, leaked.join(","));
    await q.context().close();
  }

  const g = await login(b, "guest");
  await g.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await g.getByRole("button", { name: /Add your name|Edit profile/ }).click();
  check("guest sheet has no photo", (await g.getByRole("dialog").getByText(/Add a photo|Change photo/).count()) === 0);
  check("guest upload refused", [401, 403].includes(await post(g, { action: "upload", contentType: "image/webp", sizeBytes: 1000 })));
  await g.context().close();

  const r = await login(b, "student");
  await r.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await r.getByRole("button", { name: "Edit profile" }).click();
  await r.getByRole("dialog").getByRole("button", { name: "Remove photo" }).click();
  await r.waitForTimeout(1200);
  await r.keyboard.press("Escape");
  check("removed: initials back", (await r.locator("main img[alt='Your profile photo']").count()) === 0);
  check("removed: file deleted", !fs.existsSync(path.join(dir, key)));
  await axe(r, "crop step", ["light", "dark"], async (q) => {
    await q.getByRole("button", { name: "Edit profile" }).click();
    await addPhoto(q);
  });
  check("no page errors", r.errors.length === 0, r.errors.join(" | "));
  await r.context().close();

  const d = await login(b, "del");
  await d.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  const ddir = path.join(UP, await userId(d));
  await d.getByRole("button", { name: /Add name and photo/ }).click();
  await (await addPhoto(d)).getByRole("button", { name: "Use photo" }).click();
  await d.getByRole("dialog", { name: "Edit profile" }).waitFor();
  await d.waitForTimeout(1000);
  check("photo stored for the throwaway account", photos(ddir).length === 1);
  await d.keyboard.press("Escape");
  await d.getByRole("button", { name: /Delete my account/ }).click();
  await d.fill("#delete-confirm", "DELETE");
  await d.getByRole("button", { name: "Delete for good" }).click();
  await d.waitForURL((u) => u.pathname === "/", { timeout: 20000 });
  check("photo deleted with the account", photos(ddir).length === 0);
  await d.context().close();
  await b.close();
  done();
})();
