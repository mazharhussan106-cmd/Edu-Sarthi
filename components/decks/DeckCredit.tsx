// Owns the credit line under a public deck: "by Asha K. · CC BY-SA 4.0". The
// name follows the creator's own choice (lib/libraryTerms).
//
// It deliberately shows nothing for a deck approved before the library terms:
// no name the owner never chose, and no licence they never agreed to.

import { creditName, licenceInfo, type CreditOwner } from "@/lib/libraryTerms";
import { cn } from "@/lib/utils";

export function DeckCredit({ owner, licence, linked = false, className }: { owner: CreditOwner; licence: string | null; linked?: boolean; className?: string }) {
  const name = creditName(owner);
  const lic = licenceInfo(licence);
  if (!name && !lic) return null;
  return (
    <span className={cn("block text-xs text-ink-muted", className)}>
      {name ? <>by <b className="font-medium text-ink">{name}</b></> : null}
      {name && lic ? " · " : null}
      {lic ? (linked && lic.href ? <a href={lic.href} target="_blank" rel="noopener noreferrer" className="text-accent underline">{lic.label}</a> : lic.label) : null}
    </span>
  );
}
