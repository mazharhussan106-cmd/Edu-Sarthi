// Owns the pop-up that a Settings row opens: a sheet that rises from the
// bottom on a phone, where the thumb is, and a centred box from sm up.
//
// It is built on the native <dialog> and showModal(), which give the parts
// that are easy to get wrong by hand: focus moves in and stays in, Escape
// closes it, the page behind is inert, and focus goes back to the row on
// close. It also sits in the top layer, so no ancestor's backdrop-blur or
// overflow can clip it (what once squeezed the phone menu into the header).
//
// It deliberately does NOT own whether it is open; the row that opens it does.

"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";

export function Sheet({
  open,
  onClose,
  title,
  done = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** A Done button at the bottom: for choices, where nothing else ends the sheet. */
  done?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // "close" fires for Escape and for close() alike, so the row hears both.
      onClose={onClose}
      // The dialog has no padding, so a click whose target is the dialog
      // itself landed on the dimmed backdrop, not on anything inside.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="sheet mx-0 mb-0 mt-auto max-h-[85dvh] w-full max-w-full overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-surface-raised p-0 text-ink shadow-lg shadow-shadow backdrop:bg-ink/40 sm:m-auto sm:w-[32rem] sm:max-w-[calc(100%-2rem)] sm:rounded-2xl"
    >
      <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
        {/* The grab bar says "this came up from below"; it is not a drag handle. */}
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong sm:hidden" />
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="font-display text-base font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-lg p-2 text-ink-muted hover:bg-hover hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-3">{children}</div>
        {done ? (
          <Button className="mt-5 w-full" onClick={onClose}>
            Done
          </Button>
        ) : null}
      </div>
    </dialog>
  );
}
