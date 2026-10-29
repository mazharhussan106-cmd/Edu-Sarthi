// Owns a button that opens a sheet, for when what opens it is a button or a
// link-styled action ("See all 12", "Edit") rather than a Settings row
// (components/ui/SheetRow).
//
// The sheet's content can be server-rendered and passed in as children; only
// the open/closed state lives here. It deliberately does NOT style itself
// beyond what the caller passes: a "See all" link and an "Edit profile"
// button look different and sit in different places.

"use client";

import { useState, type ReactNode } from "react";

import { Sheet } from "@/components/ui/Sheet";

export function SheetButton({
  label,
  title,
  className,
  done = false,
  form = false,
  children,
}: {
  label: ReactNode;
  title: string;
  className?: string;
  done?: boolean;
  form?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={title} done={done} form={form}>
        {children}
      </Sheet>
    </>
  );
}
