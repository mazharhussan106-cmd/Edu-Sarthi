// Owns parsing CSV text into rows of strings: quoted fields, doubled quotes,
// commas and newlines inside quotes, CRLF from Excel on Windows.
//
// It deliberately does NOT know about columns or types. The importer that
// calls it decides what each column means and reports errors by row number.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  // Excel adds a byte-order mark to "CSV UTF-8"; it would otherwise stick to
  // the first header name and make it unrecognisable.
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Blank lines (all fields empty) are dropped rather than reported.
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}
