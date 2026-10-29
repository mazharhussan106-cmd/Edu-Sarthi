// Owns the Account and privacy group on the Profile: the email and number on
// file, "Who sees what", Download my data and, for students, Delete my
// account. The menu's "Download or delete my data" link lands on this group
// (#your-data).
//
// "Who sees what" lists only what the code really shows to each kind of
// person; if a page starts showing more, this list has to change with it.
// It deliberately does NOT edit the email (Settings → Account & security,
// which re-verifies it) or the name and number (the Edit profile sheet).

import { Download, Eye, Mail, Smartphone, Trash2 } from "lucide-react";

import { SheetRow } from "@/components/ui/SheetRow";
import { DeleteAccount } from "@/components/profile/DeleteAccount";
import { IconSlot, InfoRow, LinkRow, RowGroup } from "@/components/profile/ProfileParts";

const dateIn = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export type Audience = { who: string; what: string };

export function AccountRows({
  email,
  emailVerified,
  phone,
  audiences,
  canDelete,
  closedBySupport,
}: {
  email: string | null;
  emailVerified: Date | null;
  phone: string | null;
  audiences: Audience[];
  canDelete: boolean;
  /** Teachers and admins: their accounts are closed by support, so say how. */
  closedBySupport?: boolean;
}) {
  return (
    <RowGroup id="your-data" title="Account and privacy">
      {email ? (
        <InfoRow icon={Mail} title={email} subline={emailVerified ? `Verified on ${dateIn(emailVerified)}. Change it in Settings.` : "Not verified yet"} />
      ) : null}
      {phone ? <InfoRow icon={Smartphone} title={phone} subline="Stored, not verified, never used for SMS" /> : null}
      <IconSlot icon={Eye}>
        <SheetRow title="Who sees what" subline="What teachers, admins and others can see" done>
          <ul className="divide-y divide-border">
            {audiences.map((a) => (
              <li key={a.who} className="py-2.5">
                <p className="text-sm font-medium text-ink">{a.who}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{a.what}</p>
              </li>
            ))}
          </ul>
        </SheetRow>
      </IconSlot>
      <LinkRow href="/api/me" plain icon={Download} title="Download my data" subline="Everything stored about this account, as a file" />
      {canDelete ? (
        <IconSlot icon={Trash2} danger>
          <SheetRow title="Delete my account" subline="Removes it for good. Asks you to type DELETE" form>
            <DeleteAccount />
          </SheetRow>
        </IconSlot>
      ) : null}
      {closedBySupport ? (
        <p className="py-3 text-xs text-ink-muted">To close a teacher or admin account, email support@edusarthi.com. The audits you wrote stay with the students.</p>
      ) : null}
    </RowGroup>
  );
}
