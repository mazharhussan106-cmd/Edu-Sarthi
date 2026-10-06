// Owns reading a 56-point flashcard Excel file into cards, and checking them
// before anything is saved: duplicate IDs, missing required fields, a broken
// MCQ. Pure — it takes bytes and returns data, and touches no database.
//
// It deliberately does NOT run the cards' code. Code in an uploaded file is
// text to show a learner, never something the server executes. (The check that
// runs examples belongs on the author's own machine.) Saving the result is
// lib/xlsxImport; rendering is components/decks/RichCard.

import ExcelJS from "exceljs";

import { fieldKey, detectType, REQUIRED, type CardType } from "@/lib/xlsxFields";

/// Under the 4.5 MB request cap of the hosting platform, so a too-big file fails
/// here with a clear message instead of as a network error.
export const MAX_XLSX_BYTES = 4 * 1024 * 1024;

export type ParsedCard = {
  id: string;
  type: CardType;
  topic: string;
  level: string;
  order: number;
  fields: Record<string, string>;
};

export type ParsedDeck = {
  cards: ParsedCard[];
  sheets: { name: string; type: CardType; cards: number }[];
  errors: string[];
  warnings: string[];
};

/// A cell's visible text. Formulas give their cached result, rich text its
/// joined runs, dates an ISO day. Newlines inside a cell are kept — code needs them.
function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if ("richText" in v) return v.richText.map((r) => r.text).join("");
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    if ("text" in v) return String(v.text);
    return "";
  }
  return String(v).replace(/\r\n/g, "\n").trim();
}

export async function parseCardsXlsx(buffer: Buffer): Promise<ParsedDeck> {
  const out: ParsedDeck = { cards: [], sheets: [], errors: [], warnings: [] };
  // An .xlsx is a zip; anything else is renamed junk and fails with a useful
  // message instead of a parser stack trace.
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    out.errors.push("This is not an Excel (.xlsx) file. Save the workbook as .xlsx and upload it again.");
    return out;
  }
  const wb = new ExcelJS.Workbook();
  try {
    // exceljs's Buffer type is narrower than Node's; the bytes are the same.
    await wb.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  } catch {
    out.errors.push("This Excel file could not be opened. Re-save it from Excel and try again.");
    return out;
  }

  const seen = new Map<string, string>();
  for (const ws of wb.worksheets) {
    // The heading row is the first one (of the top five) that starts with "ID";
    // v2 files put a band row above it.
    let headRow = 0;
    for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
      if (cellText(ws.getRow(r).getCell(1).value).toLowerCase() === "id") { headRow = r; break; }
    }
    if (!headRow) continue;
    const cols: { col: number; key: string }[] = [];
    ws.getRow(headRow).eachCell((cell, col) => {
      const key = fieldKey(cellText(cell.value));
      if (key && !cols.some((c) => c.key === key)) cols.push({ col, key });
    });
    const type = detectType(ws.name, new Set(cols.map((c) => c.key)));
    if (!type) continue;

    let count = 0;
    for (let r = headRow + 1; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const fields: Record<string, string> = {};
      for (const { col, key } of cols) fields[key] = cellText(row.getCell(col).value);
      const id = fields.id;
      if (!id) continue;
      count++;
      const where = `${ws.name}, row ${r} (${id})`;
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/.test(id)) out.errors.push(`${where}: the ID may only use letters, digits, - and _ (up to 40 characters).`);
      if (seen.has(id)) out.errors.push(`${where}: ID already used in ${seen.get(id)}. Every card needs its own ID.`);
      seen.set(id, ws.name);

      for (const k of REQUIRED[type]) if (!fields[k]) out.errors.push(`${where}: "${k}" is empty. Fill it in the sheet.`);
      const letter = fields.mcq_answer?.trim().toUpperCase();
      if (fields.mcq_answer && !/^[A-D]$/.test(letter)) out.errors.push(`${where}: the MCQ answer must be one letter, A to D.`);
      if (fields.mcq_options && (fields.mcq_options.match(/(?:^|\s|\|)[A-D]\)/g) ?? []).length < 4) out.errors.push(`${where}: the MCQ options must be A) B) C) D).`);
      if (fields.importance && !/^[1-5]$/.test(fields.importance.trim())) out.warnings.push(`${where}: importance should be a single digit 1 to 5.`);
      if (fields.mcq_answer) fields.mcq_answer = letter;

      const order = Number(fields.order);
      out.cards.push({ id, type, topic: fields.topic || "General", level: fields.level || "", order: Number.isFinite(order) && order > 0 ? order : out.cards.length + 1, fields });
    }
    if (count) out.sheets.push({ name: ws.name, type, cards: count });
  }

  if (!out.cards.length && !out.errors.length) {
    out.errors.push("No flashcards found. The sheet needs a heading row that starts with ID, then columns like Concept and MCQ question.");
  }
  if (out.errors.length > 30) {
    const more = out.errors.length - 30;
    out.errors.length = 30;
    out.errors.push(`…and ${more} more problems. Fix these first, then upload again.`);
  }
  return out;
}

/// Cards per topic, in study order, for the preview.
export function topicCounts(cards: ParsedCard[]): { topic: string; cards: number }[] {
  const m = new Map<string, number>();
  for (const c of cards) m.set(c.topic, (m.get(c.topic) ?? 0) + 1);
  return [...m].map(([topic, n]) => ({ topic, cards: n })).sort((a, b) => a.topic.localeCompare(b.topic));
}
