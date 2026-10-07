# FDE flashcard decks — sources and final workbooks

Owns: the card source text and the final, audited Excel workbook for the 16
Forward Deployed Engineer decks plus the earlier GitHub (`en`), Power BI (`pbi`),
API Integration (`api`) and Supabase (`sup`) decks — 20 decks, 876 cards.
Does not own: the app's import code (see `lib/xlsxImport.ts`) or the Python and
SQL decks from earlier chats, which are not in this repository.

The plan, the build status and the audit record live in `docs/FDE-FLASHCARD-PLAN.md`.

## Layout

```
<deck>/source/*.txt    card source, one @ID block per card ("¶" = new line)
<deck>/<Name>.xlsx     final workbook — the file to import into the app
tools/                 the build and audit scripts used to make the workbooks
```

Deck folders: `lnx dkr cld cicd net ts etl air k8s obs sso llm rag evl jup req pbi api sup en`.

## Rebuilding a deck

The tools expect the deck folder to sit next to `finish.py`, with the source
files directly inside it. They were run in a scratch folder, not in this tree,
because `finish.py` writes `all.txt`, `d.json` and an `out/` folder beside the
sources. To rebuild:

1. Copy `tools/` to a scratch folder.
2. Copy `<deck>/source/*.txt` into `<scratch>/<deck>/`.
3. Run `python finish.py <deck> "<Name>" "<short title>" <default card id>`.
   It stops with "fix errors first" if the audit finds an error. Needs Python
   with `openpyxl` and `Pillow`, and Node with Playwright for the screenshot.
4. Copy `<scratch>/<deck>/out/<Name>.xlsx` back here.

`tools/setf.py` changes one field of one card across the source files.
`tools/rebalance.py` spreads the correct MCQ option over A–D.
`tools/audit2.py` checks the answer spread and duplicate ids across all decks.

## Audit state (7 Oct 2026)

Two full card-by-card rounds. Every deck builds with 0 errors and 0 warnings.
Snippets were run in Node, Python, git and PostgreSQL where that was possible.
Shell, YAML and cloud commands were read, not run on a real machine.
