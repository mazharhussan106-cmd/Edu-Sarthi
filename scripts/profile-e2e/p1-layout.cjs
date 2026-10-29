// Phase P1 checks: the student Profile's identity card, Edit profile sheet,
// goal sheet, badge and Who-sees-what sheets, delete account, the #your-data
// link, the dashboard streak, and axe for every role. Expects a fresh seed.

const { chromium, BASE, check, login, axe, done } = require("./lib.cjs");

(async () => {
  const b = await chromium.launch();
  const p = await login(b, "student");
  await p.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  check("identity shows name", await p.getByRole("heading", { level: 1, name: "Rahul Sharma" }).isVisible());
  check("streak tile = 11 (recording or card rule)", (await p.locator("section[aria-label='Your numbers'] li").first().innerText()).includes("11"));

  const edit = p.getByRole("button", { name: "Edit profile" });
  await edit.focus();
  await p.keyboard.press("Enter");
  const dlg = p.getByRole("dialog", { name: "Edit profile" });
  await dlg.waitFor();
  check("edit sheet opens with focus inside", await p.evaluate(() => !!document.activeElement.closest("dialog")));
  await p.fill("#profile-name", "Rahul S Sharma");
  await p.fill("#profile-phone", "12345");
  await dlg.getByRole("button", { name: "Save" }).click();
  check("bad phone shows an error", await dlg.getByRole("alert").isVisible());
  await p.keyboard.press("Escape");
  await dlg.waitFor({ state: "hidden" });
  check("escape closes and focus returns", await p.evaluate(() => document.activeElement?.textContent === "Edit profile"));
  await edit.click();
  await dlg.waitFor();
  check("closing reset the typed name", (await p.inputValue("#profile-name")) === "Rahul Sharma");
  await p.fill("#profile-name", "Rahul S Sharma");
  await p.fill("#profile-phone", "");
  await dlg.getByRole("button", { name: "Save" }).click();
  await dlg.waitFor({ state: "hidden" });
  await p.waitForTimeout(800);
  check("name saved", await p.getByRole("heading", { level: 1, name: "Rahul S Sharma" }).isVisible());
  check("phone removed", !(await p.getByText("9876543210").isVisible()));
  await edit.click();
  await dlg.waitFor();
  await p.fill("#profile-name", "Rahul Sharma");
  await p.fill("#profile-phone", "9876543210");
  await dlg.getByRole("button", { name: "Save" }).click();
  await dlg.waitFor({ state: "hidden" });
  await p.waitForTimeout(800);
  check("name and phone restored", (await p.getByRole("heading", { level: 1, name: "Rahul Sharma" }).isVisible()) && (await p.getByText("9876543210").isVisible()));

  await p.getByRole("button", { name: "Edit my goal" }).click();
  const g = p.getByRole("dialog", { name: "My goal" });
  await g.waitFor();
  await g.getByText("Interviews", { exact: true }).click();
  await p.waitForTimeout(500);
  await g.getByRole("button", { name: "Done" }).click();
  await g.waitFor({ state: "hidden" });
  await p.waitForTimeout(800);
  check("goal changed on card", await p.locator("#my-goal dd").getByText("Interviews").isVisible());
  await p.reload({ waitUntil: "networkidle" });
  check("goal survives reload", await p.locator("#my-goal dd").getByText("Interviews").isVisible());
  await p.getByRole("button", { name: "Edit my goal" }).click();
  await g.waitFor();
  await g.getByText("IELTS / exams", { exact: true }).click();
  await p.waitForTimeout(500);
  await g.getByRole("button", { name: "Done" }).click();
  await g.waitFor({ state: "hidden" });

  await p.getByRole("button", { name: /see all 12/ }).click();
  const bs = p.getByRole("dialog", { name: "Badges" });
  check("badge sheet lists 12 with hints", (await bs.locator("li").count()) === 12 && (await bs.getByText("Mark 100 cards known").isVisible()));
  await bs.getByRole("button", { name: "Done" }).click();
  await p.getByRole("button", { name: /Who sees what/ }).click();
  const ws = p.getByRole("dialog", { name: "Who sees what" });
  check("who-sees-what names the institute admin", await ws.getByText("Sunrise Institute's admin").isVisible());
  await ws.getByRole("button", { name: "Done" }).click();
  check("student download row claims everything", await p.getByText("Everything stored about this account, as a file").isVisible());
  await axe(p, "student profile");
  await axe(p, "who-sees-what sheet", ["light", "dark"], async (q) => {
    await q.getByRole("button", { name: /Who sees what/ }).click();
    await q.getByRole("dialog", { name: "Who sees what" }).waitFor();
  });
  await axe(p, "goal sheet", ["light", "sepia"], async (q) => {
    await q.getByRole("button", { name: "Edit my goal" }).click();
    await q.getByRole("dialog", { name: "My goal" }).waitFor();
  });
  check("no page errors (student)", p.errors.length === 0, p.errors.join(" | "));

  await p.goto(`${BASE}/profile#your-data`, { waitUntil: "networkidle" });
  await p.waitForTimeout(800);
  check("#your-data scrolls to account group", await p.evaluate(() => { const r = document.getElementById("your-data").getBoundingClientRect(); return r.top >= 0 && r.top < 300; }));
  await p.goto(`${BASE}/dashboard`, { waitUntil: "networkidle" });
  check("dashboard streak = 11", await p.getByText("11", { exact: true }).first().isVisible());
  await p.context().close();

  const d = await login(b, "del");
  await d.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
  await d.getByRole("button", { name: /Delete my account/ }).click();
  const dd = d.getByRole("dialog", { name: "Delete my account" });
  check("delete button off until DELETE typed", await dd.getByRole("button", { name: "Delete for good" }).isDisabled());
  await d.mouse.click(5, 5);
  check("form sheet ignores a tap outside", await dd.isVisible());
  await d.fill("#delete-confirm", "DELETE");
  await dd.getByRole("button", { name: "Delete for good" }).click();
  await d.waitForURL((u) => u.pathname === "/", { timeout: 20000 });
  check("deleted account is signed out to home", true);
  await d.context().close();

  for (const who of ["new", "guest"]) {
    const q = await login(b, who);
    await q.goto(`${BASE}/profile`, { waitUntil: "networkidle" });
    await axe(q, `${who} profile`, ["light", "dark"]);
    if (who === "guest") check("guest has no My content", (await q.getByText("My content").count()) === 0);
    if (who === "new") {
      await q.getByRole("link", { name: "Set ›" }).click();
      const opened = await q.getByRole("dialog", { name: "My goal" }).waitFor({ timeout: 5000 }).then(() => true, () => false);
      check("Get started 'Set' opens the goal sheet", opened);
    }
    check(`no page errors (${who})`, q.errors.length === 0, q.errors.join(" | "));
    await q.context().close();
  }
  await b.close();
  done();
})();
