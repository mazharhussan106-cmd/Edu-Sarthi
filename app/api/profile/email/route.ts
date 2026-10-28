// Owns the two requests behind "Change email" in Settings: start (prove it is
// you; a code goes to the new address) and confirm (the code changes the
// address and signs out every device). The rules live in lib/emailChange.
//
// It deliberately answers a taken address exactly as it answers a free one:
// the difference is only in which email goes out, and the person typing never
// sees it. Emails are sent after the rows are written; an email that cannot
// be sent drops the request so the person can try again at once.

import { NextResponse } from "next/server";

import { emailChangeSchema } from "@/lib/accountSchemas";
import { requireUser } from "@/lib/apiUser";
import { sendEmailAlreadyUsed, sendEmailChangeCode, sendEmailChangeCurrentCode, sendEmailChanged } from "@/lib/email";
import { cancelEmailChange, confirmEmailChange, maskEmail, startEmailChange } from "@/lib/emailChange";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Verified only: an unproven address is not one this account may move away from.
  const gate = await requireUser({ verified: true, member: true });
  if (!gate.ok) return gate.res;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Refresh the page and try again." }, { status: 400 });
  }
  const parsed = emailChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form and try again." }, { status: 400 });
  }
  const input = parsed.data;

  if (input.action === "start") {
    const res = await startEmailChange(gate.id, input);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
    try {
      if (res.toNew.code) await sendEmailChangeCode(res.toNew.email, res.toNew.code);
      else await sendEmailAlreadyUsed(res.toNew.email);
      if (res.toCurrent) await sendEmailChangeCurrentCode(res.toCurrent.email, res.toCurrent.code);
    } catch {
      await cancelEmailChange(gate.id, res.requestId);
      return NextResponse.json({ error: "We could not send the email just now. Wait a minute and try again." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, sentTo: res.toNew.email, currentCode: res.toCurrent !== null });
  }

  const res = await confirmEmailChange(gate.id, input);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });

  // After the change has committed. The person is about to be signed out, so
  // the inbox note waits for their next sign-in; the old address is told in
  // case the change was not theirs. Neither may undo the change by failing.
  await notify(gate.id, "email_changed", {
    title: "Your sign-in email was changed",
    body: `This account now signs in with ${res.newEmail}. If this was not you, write to support@edusarthi.com.`,
    link: "/settings",
  });
  if (res.oldEmail) {
    await sendEmailChanged(res.oldEmail, maskEmail(res.newEmail)).catch(() => console.error("Could not send the email-changed notice"));
  }
  return NextResponse.json({ ok: true, email: res.newEmail });
}
