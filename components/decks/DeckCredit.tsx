// Owns the credit lines under a deck: "by Asha K. · CC BY-SA 4.0", and for a
// copy "Copied from <title> by <name>". The name follows each creator's own
// choice (lib/libraryTerms).
//
// It deliberately shows no name or licence for a deck approved before the
// library terms: nothing the owner never chose or agreed to.

import Link from "next/link";

import { creditName, licenceInfo, type CreditOwner } from "@/lib/libraryTerms";
import { cn } from "@/lib/utils";

type Props = {
  owner?: CreditOwner;
  licence?: string | null;
  /// From copiedFrom(): the original, linked while it is in the library.
  source?: { line: string; href: string | null } | null;
  /// Links are off inside list rows that are themselves one big link.
  linked?: boolean;
  className?: string;
};

export function DeckCredit({ owner, licence = null, source, linked = false, className }: Props) {
  const name = owner ? creditName(owner) : null;
  const lic = licenceInfo(licence);
  if (!name && !lic && !source) return null;
  return (
    <>
      {name || lic ? (
        <span className={cn("block text-xs text-ink-muted", className)}>
          {name ? <>by <b className="font-medium text-ink">{name}</b></> : null}
          {name && lic ? " · " : null}
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
