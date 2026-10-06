// Owns reading a multiple-choice options cell: "A) one | B) two | C) x | D) y",
// "A) one B) two …" or one option per line. The import check and the card on
// screen both use THIS parser, so a sheet that passes the check always renders
// the options it was checked for. (They used to differ: a sheet written
// "A) one|B) two" passed the check and showed one option.)
//
// It deliberately holds no rendering and no answer checking.

export type McqOption = { key: string; text: string };

export function parseMcqOptions(raw: string | undefined): McqOption[] {
  if (!raw) return [];
  const parts = raw.split(/(?:^|[\s|])([A-D])\)\s*/);
  // split() with a capture group gives [before, key, text, key, text, …]; the
  // first piece is whatever came before "A)" and is not an option.
  const out: McqOption[] = [];
  for (let i = 1; i + 1 < parts.length; i += 2) {
    out.push({ key: parts[i], text: parts[i + 1].replace(/\s*\|\s*$/, "").trim() });
  }
  return out;
}
