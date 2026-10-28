// Owns the inbox's two requests: GET the unread count (the header bell asks
// when the page changes), and POST a read mark — one notification, the notices
// shown on the inbox page, or everything.
//
// The person is always the session's. An id in the body only ever matches that
// person's own rows, so nobody can read or mark someone else's inbox.
// It deliberately does NOT list notifications: the inbox page reads them on the
// server, and a second way to fetch them would be a second thing to scope.

import { NextResponse } from "next/server";

import { requireUser } from "@/lib/apiUser";
import { inboxActionSchema, markAllRead, markNoticesSeen, markRead, unreadCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// The count changes with every read; a cached answer puts a wrong number on the bell.
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;
  return NextResponse.json({ unread: await unreadCount(gate.id, gate.role) }, { headers: NO_STORE });
}

export async function POST(req: Request) {
  const gate = await requireUser();
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Refresh the page and try again." }, { status: 400 });
  }
  const parsed = inboxActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "That request was not understood. Refresh the page and try again." }, { status: 400 });
  }

  const a = parsed.data;
  if (a.action === "read") await markRead(gate.id, a.id);
  else if (a.action === "read-all") await markAllRead(gate.id, gate.role);
  // Notices are for students; anyone else has none in their inbox to mark.
  else if (gate.role === "STUDENT") await markNoticesSeen(gate.id, a.ids);

  return NextResponse.json({ ok: true, unread: await unreadCount(gate.id, gate.role) }, { headers: NO_STORE });
}
