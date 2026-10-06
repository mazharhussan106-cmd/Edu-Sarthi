// Owns showing a card's Markdown notes: paragraphs, bullet lists, **bold**,
// *italic*, `inline code` and ``` fenced code ```.
//
// It builds React elements and never raw HTML, so a card shared with other
// people cannot carry a script or a tracking image. Links and images in the
// text are deliberately left as plain text for the same reason.
// It deliberately is not a full Markdown parser — headings, tables and nesting
// are out of scope; anything it does not recognise just shows as text.

import type { ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const key = m.index;
    if (t.startsWith("`")) out.push(<code key={key} className="rounded bg-paper-dim px-1 font-mono text-[0.9em]">{t.slice(1, -1)}</code>);
    else if (t.startsWith("**")) out.push(<strong key={key}>{t.slice(2, -2)}</strong>);
    else out.push(<em key={key}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function CardMarkdown({ source }: { source: string }) {
  const blocks: ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) code.push(lines[i++]);
      i++; // closing fence (or end of text, for an unclosed block)
      blocks.push(
        <pre key={blocks.length} className="overflow-x-auto rounded-lg bg-paper-dim p-3 font-mono text-xs text-ink">
          <code>{code.join("\n")}</code>
        </pre>,
      );
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      blocks.push(
        <ul key={blocks.length} className="list-disc pl-5">
          {items.map((t, n) => <li key={n}>{inline(t)}</li>)}
        </ul>,
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].trim().startsWith("```") && !/^\s*[-*]\s+/.test(lines[i])) para.push(lines[i++]);
      blocks.push(<p key={blocks.length}>{inline(para.join(" "))}</p>);
    }
  }
  return <div className="flex flex-col gap-2 text-sm text-ink">{blocks}</div>;
}
