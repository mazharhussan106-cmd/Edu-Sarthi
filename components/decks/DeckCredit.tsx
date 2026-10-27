// Owns the credit lines under a deck: "by Asha K. with Ravi S. · CC BY-SA
// 4.0", for an institute's deck "[logo] by Sunrise Academy (Asha K.)", and for
// a copy "Copied from <title> by <name>". Each name follows that person's own
// choice (lib/libraryTerms).
//
// A server component: the institute's approved logo is turned into a signed
// URL here, once per logo per page (lib/instituteLogo). It deliberately shows
// no name or licence for a deck approved before the library terms: nothing the
// owner never chose or agreed to.

import Link from "next/link";

import { creditName, licenceInfo, personCredit, type CreditInstitute, type CreditOwner } from "@/lib/libraryTerms";
import { logoUrl } from "@/lib/instituteLogo";
import { cn } from "@/lib/utils";

type Props = {
  owner?: CreditOwner;
  /// The institute the deck was published as; pass it only for a public deck.
  institute?: CreditInstitute | null;
  /// Editors it is shared with, credited by their own name choice; those who
  /// never chose one are left out rather than named without asking.
  contributors?: CreditOwner[];
  licence?: string | null;
  /// From copiedFrom(): the original, linked while it is in the library.
  source?: { line: string; href: string | null } | null;
  /// Links are off inside list rows that are themselves one big link.
  linked?: boolean;
  className?: string;
};

export async function DeckCredit({ owner, institute = null, contributors = [], licence = null, source, linked = false, className }: Props) {
  const name = owner ? personCredit(owner, institute) : null;
  const helpers = contributors.map(creditName).filter((n): n is string => Boolean(n));
  const lic = licenceInfo(licence);
  const logo = institute?.logoKey ? await logoUrl(institute.logoKey) : null;
  const by = institute || name;
  if (!by && !lic && !source) return null;
  return (
    <>
      {by || lic ? (
        <span className={cn("block text-xs text-ink-muted", className)}>
          {/* Decorative: the institute's name follows in text. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt="" width={16} height={16} className="mr-1 inline-block size-4 rounded-sm object-contain align-[-3px]" /> : null}
          {institute ? <>by <b className="font-medium text-ink">{institute.name}</b>{name ? ` (${name})` : null}</> : name ? <>by <b className="font-medium text-ink">{name}</b></> : null}
          {by && helpers.length ? <> with <b className="font-medium text-ink">{helpers.join(", ")}</b></> : null}
          {by && lic ? " · " : null}
          {lic ? (linked && lic.href ? <a href={lic.href} target="_blank" rel="noopener noreferrer" className="text-accent underline">{lic.label}</a> : lic.label) : null}
        </span>
      ) : null}
      {source ? (
        <span className={cn("block text-xs text-ink-muted", className)}>
          Copied from {linked && source.href ? <Link href={source.href} className="text-accent underline">{source.line}</Link> : source.line}
        </span>
      ) : null}
    </>
  );
}
