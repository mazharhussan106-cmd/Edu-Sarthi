// Owns the PDFs and photos people add as sources for the AI card maker:
// accepting an upload (type and size decided here, before a URL is issued),
// reading the file back for the model, and deleting it afterwards.
//
// A file lives in storage only until the cards are made, or a day if the person
// walks away (sweepSources, run by the daily cron). It deliberately does NOT
// call the model or count tokens (lib/aiCards), and never trusts the browser's
// word for what a file is: the type is checked again against the file's first
// bytes when it is read.

import type { SourceInput } from "@/lib/aiCards";
import { AiError } from "@/lib/aiTranscribe";
import { MAX_SOURCES } from "@/lib/aiCardSchemas";
import { readObjectBytes } from "@/lib/mediaBytes";
import { prisma } from "@/lib/prisma";
import { createUploadTarget, objectExists, removeObjects } from "@/lib/storage";

export const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024;
/// How long an unused source file may sit in storage.
export const SOURCE_KEEP_MS = 24 * 60 * 60 * 1000;

export const SOURCE_TYPES: Record<string, "pdf" | "image"> = {
  "application/pdf": "pdf",
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
};

/// The first bytes of each allowed type. A file renamed to .pdf is not a PDF.
function looksLike(mediaType: string, b: Uint8Array): boolean {
  const at = (i: number, s: string) => s.split("").every((c, n) => b[i + n] === c.charCodeAt(0));
  if (mediaType === "application/pdf") return at(0, "%PDF-");
  if (mediaType === "image/png") return b[0] === 0x89 && at(1, "PNG");
  if (mediaType === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (mediaType === "image/webp") return at(0, "RIFF") && at(8, "WEBP");
  return false;
}

export type Registered = { id: string; name: string; url: string; token: string };

/// Checks a file the browser wants to upload and, if acceptable, records it and
/// returns the one-time upload address. Errors are written for the person.
export async function registerSource(
  userId: string,
  file: { filename: string; contentType: string; sizeBytes: number },
): Promise<Registered | { error: string }> {
  if (!SOURCE_TYPES[file.contentType]) return { error: "Add a PDF, or a JPG, PNG or WebP picture. Other file types cannot be read." };
  if (file.sizeBytes > MAX_SOURCE_FILE_BYTES) {
    return { error: `That file is over ${MAX_SOURCE_FILE_BYTES / 1024 / 1024} MB. Use fewer pages, or take a smaller photo, and add it again.` };
  }
  // Counted from the table, so files waiting to be used count against the cap
  // whichever tab or device uploaded them.
  const waiting = await prisma.aiSource.count({ where: { userId } });
  if (waiting >= MAX_SOURCES) return { error: `You can add up to ${MAX_SOURCES} files at once. Remove one, or make the cards first, then add more.` };

  try {
    const target = await createUploadTarget(userId, file.filename);
    const row = await prisma.aiSource.create({
      data: { userId, key: target.key, mediaType: file.contentType, name: file.filename.slice(0, 120), sizeBytes: file.sizeBytes },
      select: { id: true, name: true },
    });
    return { id: row.id, name: row.name, url: target.url, token: target.token };
  } catch {
    return { error: "Uploads are not working right now. Paste the text instead, or try again later." };
  }
}

export type ResolvedSources = { sources: SourceInput[]; fileIds: string[] };

/// Turns what the browser sent (pasted text and file ids) into what the model
/// reads. File ids are looked up under the signed-in person, so one person
/// cannot name another's file.
export async function resolveSources(
  userId: string,
  given: ({ type: "text"; text: string } | { type: "file"; id: string })[],
): Promise<ResolvedSources> {
  const ids = given.flatMap((g) => (g.type === "file" ? [g.id] : []));
  const rows = ids.length ? await prisma.aiSource.findMany({ where: { id: { in: ids }, userId } }) : [];
  const byId = new Map(rows.map((r) => [r.id, r]));

  const sources: SourceInput[] = [];
  for (const g of given) {
    if (g.type === "text") {
      sources.push({ type: "text", text: g.text });
      continue;
    }
    const row = byId.get(g.id);
    const gone = new AiError("One of your files is no longer available. Add it again, or remove it from the list.");
    if (!row) throw gone;
    if (!(await objectExists(row.key))) throw new AiError(`"${row.name}" did not finish uploading. Add it again.`);
    const data = await readObjectBytes(row.key, MAX_SOURCE_FILE_BYTES, () => new AiError(`"${row.name}" is too large. Use fewer pages and add it again.`));
    if (!data) throw gone;
    if (!looksLike(row.mediaType, new Uint8Array(data, 0, Math.min(16, data.byteLength)))) {
      throw new AiError(`"${row.name}" is not a real ${SOURCE_TYPES[row.mediaType] === "pdf" ? "PDF" : "picture"}. Add the original file again.`);
    }
    const base64 = Buffer.from(data).toString("base64");
    sources.push(
      SOURCE_TYPES[row.mediaType] === "pdf"
        ? { type: "pdf", data: base64 }
        : { type: "image", mediaType: row.mediaType as "image/jpeg" | "image/png" | "image/webp", data: base64 },
    );
  }
  return { sources, fileIds: [...byId.keys()] };
}

/// Deletes these files from storage and their rows. A row whose file could not
/// be removed is kept, so the daily sweep tries again instead of orphaning it.
export async function deleteSources(userId: string | null, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const rows = await prisma.aiSource.findMany({ where: { id: { in: ids }, ...(userId ? { userId } : {}) }, select: { id: true, key: true } });
  const failed = new Set(await removeObjects(rows.map((r) => r.key)));
  const done = rows.filter((r) => !failed.has(r.key)).map((r) => r.id);
  if (done.length) await prisma.aiSource.deleteMany({ where: { id: { in: done } } });
}

/// The daily clean-up of files nobody finished with. Bounded per run.
export async function sweepSources(now = Date.now(), limit = 500): Promise<number> {
  const old = await prisma.aiSource.findMany({
    where: { createdAt: { lt: new Date(now - SOURCE_KEEP_MS) } },
    select: { id: true },
    take: limit,
  });
  await deleteSources(null, old.map((r) => r.id));
  return old.length;
}
