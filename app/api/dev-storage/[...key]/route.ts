// Owns the development-only stand-in for Supabase Storage: PUT writes a file
// under .dev-uploads/, GET streams it back with range support so the player
// can seek.
//
// It deliberately refuses every request unless LOCAL_STORAGE is on, which is
// never the case in production. Reads are limited to the owner and to
// teachers, mirroring what signed URLs allow in the real bucket.

import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { ALLOWED_TYPES, LOCAL_STORAGE, localPath, MAX_UPLOAD_BYTES, isOwnKey } from "@/lib/storage";

const TYPE_BY_EXT: Record<string, string> = {
  webm: "audio/webm",
  mp4: "video/mp4",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  mov: "video/quicktime",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

async function resolve(params: Promise<{ key: string[] }>) {
  const { key } = await params;
  const joined = key.map(decodeURIComponent).join("/");
  return { key: joined, full: localPath(joined) };
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!LOCAL_STORAGE) return new NextResponse(null, { status: 404 });

  const session = await auth();
  const userId = session?.user?.id;
  const { key, full } = await resolve(params);
  // Same ownership rule the real upload URL enforces by being issued per key.
  if (!userId || !full || !isOwnKey(userId, key)) {
    return new NextResponse(null, { status: 403 });
  }

  const type = req.headers.get("content-type") ?? "";
  if (!ALLOWED_TYPES[type]) return new NextResponse(null, { status: 415 });

  const bytes = Buffer.from(await req.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_UPLOAD_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (!LOCAL_STORAGE) return new NextResponse(null, { status: 404 });

  const session = await auth();
  const user = session?.user;
  const { key, full } = await resolve(params);
  const isStaff = user?.role === "TEACHER" || user?.role === "ADMIN";
  if (!user?.id || !full || (!isStaff && !isOwnKey(user.id, key))) {
    return new NextResponse(null, { status: 403 });
  }

  let data: Buffer;
  try {
    data = await readFile(full);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const type = TYPE_BY_EXT[ext] ?? "application/octet-stream";

  // Browsers need range responses to seek audio and video; without them the
  // timestamp buttons silently restart playback from zero.
  const range = req.headers.get("range");
  const match = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
  if (match) {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), data.length - 1) : data.length - 1;
    return new NextResponse(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Range": `bytes ${start}-${end}/${data.length}`,
        "Content-Length": String(end - start + 1),
        "Accept-Ranges": "bytes",
      },
    });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: { "Content-Type": type, "Content-Length": String(data.length), "Accept-Ranges": "bytes" },
  });
}
