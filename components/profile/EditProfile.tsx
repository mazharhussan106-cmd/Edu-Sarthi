// Owns the Edit profile sheet: the photo (members; components/profile/
// PhotoEditor saves it on its own), the display name, and the mobile number
// for accounts that are not guests. One Save sends only what changed, each to
// its own route (app/api/profile/name and /phone), so a name fix never touches
// the number. While a photo is being cropped, the form steps aside.
//
// It is a form sheet: a stray tap outside must not throw away typing, and
// closing it by any route puts the fields back to what is saved.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { PhotoEditor } from "@/components/profile/PhotoEditor";
import { nameSchema, phoneSchema } from "@/lib/validations";

async function send(url: string, body: object): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const raw = await res.text();
    let data: { error?: string } = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
    return res.ok ? null : (data.error ?? "That did not save. Try again.");
  } catch {
    return "Could not reach the server. Check your connection and try again.";
  }
}

type Photo = { url: string | null; initials: string; note: string };

export function EditProfile({
  label,
  name,
  phone,
  showPhone,
  photo,
}: {
  label: string;
  name: string | null;
  phone: string | null;
  showPhone: boolean;
  /** Members only; a guest gets no photo. */
  photo?: Photo;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [n, setN] = useState(name ?? "");
  const [ph, setPh] = useState(phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setCropping(false);
    setN(name ?? "");
    setPh(phone ?? "");
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nameChanged = n.trim() !== (name ?? "");
    const phoneChanged = showPhone && ph !== (phone ?? "");
    const parsedName = nameSchema.safeParse({ name: n });
    if (nameChanged && !parsedName.success) {
      setError(parsedName.error.issues[0]?.message ?? "Enter your name.");
      return;
    }
    const parsedPhone = phoneSchema.safeParse({ phone: ph });
    if (phoneChanged && !parsedPhone.success) {
      setError(parsedPhone.error.issues[0]?.message ?? "Enter a 10-digit mobile number, or leave it empty.");
      return;
    }
    setBusy(true);
    const err =
      (nameChanged && parsedName.success ? await send("/api/profile/name", parsedName.data) : null) ??
      (phoneChanged && parsedPhone.success ? await send("/api/profile/phone", parsedPhone.data) : null);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="md" aria-haspopup="dialog" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Sheet open={open} onClose={close} title={cropping ? "Move and zoom" : "Edit profile"} form>
        {photo && open ? (
          <div className={cropping ? undefined : "mb-5 border-b border-border pb-5"}>
            <PhotoEditor photoUrl={photo.url} initials={photo.initials} note={photo.note} onCropping={setCropping} />
          </div>
        ) : null}
        <form onSubmit={save} className={cropping ? "hidden" : "flex flex-col gap-4"}>
          <div>
            <Label htmlFor="profile-name">Your name</Label>
            <Input id="profile-name" value={n} onChange={(e) => setN(e.target.value)} autoComplete="name" placeholder="e.g. Rahul Sharma" />
          </div>
          {showPhone ? (
            <div>
              <Label htmlFor="profile-phone">Mobile number (optional)</Label>
              <Input
                id="profile-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={ph}
                onChange={(e) => setPh(e.target.value.replace(/\D/g, ""))}
                placeholder="10 digits, e.g. 9876543210"
                aria-describedby="profile-phone-note"
              />
              <p id="profile-phone-note" className="mt-1.5 text-xs text-ink-muted">
                Not checked and not used for SMS. Leave it empty to remove it.
              </p>
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="text-xs text-error">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2 [&>*]:flex-1">
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
