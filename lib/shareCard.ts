// Owns how the "Share my progress" picture is drawn: a 1080 × 1350 image
// (the 4:5 shape WhatsApp and Instagram show whole) with only the items the
// student switched on.
//
// It is drawn in the browser and never uploaded. A picture is not themed, so
// its colours are the brand values from the light theme in app/globals.css,
// named once here; if the brand colours change there, change them here too.
// It deliberately never draws the STU ID or the email: a shared picture
// travels far beyond the app.

export const CARD_W = 1080;
export const CARD_H = 1350;

// Light-theme brand tokens (globals.css: --color-tag-navy, --color-accent,
// --color-brand, --color-saffron, --color-surface).
const NAVY = "#1f3a68";
const ACCENT = "#0077b3";
const BRAND = "#0096d6";
const SAFFRON = "#ff8206";
const WHITE = "#ffffff";

export type ShareItems = {
  name: string | null;
  photo: HTMLImageElement | null;
  streak: number | null;
  cardsKnown: number | null;
  badges: { earned: number; total: number } | null;
  skill: { label: string; change: number } | null;
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawShareCard(ctx: CanvasRenderingContext2D, it: ShareItems, fonts: { display: string; body: string }) {
  const D = `${fonts.display}, system-ui, sans-serif`;
  const B = `${fonts.body}, system-ui, sans-serif`;
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  g.addColorStop(0, NAVY);
  g.addColorStop(0.7, ACCENT);
  g.addColorStop(1, BRAND);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.globalAlpha = 0.28;
  ctx.fillStyle = SAFFRON;
  ctx.beginPath();
  // In the corner, clear of the number rows, so they stay easy to read.
  ctx.arc(CARD_W + 30, CARD_H + 30, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = WHITE;
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 64px ${D}`;
  ctx.fillText("EduSarthi", 80, 150);

  if (it.photo) {
    const r = 110;
    const cx = CARD_W - 80 - r;
    const cy = 150;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(it.photo, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.font = `500 44px ${B}`;
  ctx.globalAlpha = 0.92;
  ctx.fillText(it.name ? `${it.name} is practising English` : "I am practising English", 80, 330);
  ctx.globalAlpha = 1;

  let y = 380;
  if (it.streak !== null) {
    ctx.font = `800 260px ${D}`;
    ctx.fillText(String(it.streak), 70, y + 230);
    ctx.font = `600 56px ${B}`;
    ctx.fillText(it.streak === 1 ? "day in a row" : "days in a row", 80, y + 310);
    y += 380;
  }

  const rows: [string, string][] = [];
  if (it.cardsKnown !== null) rows.push(["Cards known", String(it.cardsKnown)]);
  if (it.badges) rows.push(["Badges", `${it.badges.earned} of ${it.badges.total}`]);
  if (it.skill) rows.push([`${it.skill.label} since my first audit`, `+${it.skill.change.toFixed(1)}`]);
  for (const [label, value] of rows) {
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = WHITE;
    roundRect(ctx, 80, y, CARD_W - 160, 120, 28);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = `500 42px ${B}`;
    ctx.fillText(label, 120, y + 75);
    ctx.font = `700 50px ${D}`;
    const w = ctx.measureText(value).width;
    ctx.fillText(value, CARD_W - 120 - w, y + 78);
    y += 150;
  }

  ctx.font = `500 38px ${B}`;
  ctx.globalAlpha = 0.85;
  ctx.fillText("Practise spoken English with EduSarthi", 80, CARD_H - 90);
  ctx.globalAlpha = 1;
}
