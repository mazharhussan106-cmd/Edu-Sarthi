// Owns the "Share my progress" button and sheet: a live preview of the
// picture, a switch for each item on it, and Share (the phone's own share
// menu, so WhatsApp or Instagram) or Download.
//
// The picture is drawn in the browser by lib/shareCard and is never sent to
// EduSarthi; nothing is posted anywhere unless the student shares it. The
// photo starts switched off: a picture of a child travels further than a
// number does.

"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { CARD_H, CARD_W, drawShareCard } from "@/lib/shareCard";

export type ShareData = {
  firstName: string | null;
  photoUrl: string | null;
  streak: number;
  cardsKnown: number;
  badges: { earned: number; total: number };
  skill: { label: string; change: number } | null;
};

type Key = "name" | "photo" | "streak" | "cards" | "badges" | "skill";

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob | null>((res) => c.toBlob(res, "image/png"));

export function ShareProgress({ data }: { data: ShareData }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState<Record<Key, boolean>>({ name: Boolean(data.firstName), photo: false, streak: true, cards: true, badges: true, skill: Boolean(data.skill) });
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (!open || !on.photo || photo || !data.photoUrl) return;
    const im = new Image();
    // Without this the picture would be "tainted" and could not be saved.
    im.crossOrigin = "anonymous";
    im.onload = () => setPhoto(im);
    im.onerror = () => {
      setOn((o) => ({ ...o, photo: false }));
      setNote("Your photo could not be added. You can share without it.");
    };
    im.src = data.photoUrl;
  }, [open, on.photo, photo, data.photoUrl]);

  useEffect(() => {
    if (!open) return;
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const css = getComputedStyle(document.documentElement);
    const fonts = { display: css.getPropertyValue("--font-sora").trim() || "sans-serif", body: css.getPropertyValue("--font-inter").trim() || "sans-serif" };
    const draw = () =>
      drawShareCard(
        ctx,
        {
          name: on.name ? data.firstName : null,
          photo: on.photo ? photo : null,
          streak: on.streak ? data.streak : null,
          cardsKnown: on.cards ? data.cardsKnown : null,
          badges: on.badges ? data.badges : null,
          skill: on.skill ? data.skill : null,
        },
        fonts,
      );
    draw();
    // Draw again once the fonts are in, or the first preview uses a fallback.
    void document.fonts.ready.then(draw);
  }, [open, on, photo, data]);

  useEffect(() => {
    const probe = new File([new Blob()], "x.png", { type: "image/png" });
    setCanShare(typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] }));
  }, []);

  async function file(): Promise<File | null> {
    try {
      const blob = canvas.current ? await toBlob(canvas.current) : null;
      return blob ? new File([blob], "my-edusarthi-progress.png", { type: "image/png" }) : null;
    } catch {
      return null;
    }
  }

  async function share() {
    setNote(null);
    const f = await file();
    if (!f) return setNote("The picture could not be made. Switch the photo off and try again.");
    try {
      await navigator.share({ files: [f], text: "My English practice on EduSarthi" });
    } catch (e) {
      // Closing the share menu is not an error worth a message.
      if ((e as Error)?.name !== "AbortError") setNote("Sharing did not work here. Use Download instead.");
    }
  }

  async function download() {
    setNote(null);
    const f = await file();
    if (!f) return setNote("The picture could not be made. Switch the photo off and try again.");
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const toggle = (k: Key) => (v: boolean) => setOn((o) => ({ ...o, [k]: v }));

  return (
    <>
      <Button aria-haspopup="dialog" onClick={() => setOpen(true)}>
        Share progress
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Share my progress">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <canvas
            ref={canvas}
            width={CARD_W}
            height={CARD_H}
            role="img"
            aria-label="Preview of the picture you can share. It shows only the items switched on."
            className="mx-auto w-40 shrink-0 rounded-xl border border-border sm:w-44"
          />
          <div className="min-w-0 flex-1 divide-y divide-border">
            {data.firstName ? <Switch label="First name" checked={on.name} onCheckedChange={toggle("name")} /> : null}
            {data.photoUrl ? <Switch label="Photo" checked={on.photo} onCheckedChange={toggle("photo")} /> : null}
            <Switch label="Streak" checked={on.streak} onCheckedChange={toggle("streak")} />
            <Switch label="Cards known" checked={on.cards} onCheckedChange={toggle("cards")} />
            <Switch label="Badges" checked={on.badges} onCheckedChange={toggle("badges")} />
            {data.skill ? <Switch label="Best skill change" checked={on.skill} onCheckedChange={toggle("skill")} /> : null}
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          The picture is made on this device and EduSarthi does not post it anywhere. Your STU ID and email are never on it.
        </p>
        {note ? (
          <p role="alert" className="mt-2 text-xs text-error">
            {note}
          </p>
        ) : null}
        <div className="mt-4 flex gap-2 [&>*]:flex-1">
          <Button variant={canShare ? "outline" : "primary"} onClick={() => void download()}>
            Download
          </Button>
          {canShare ? <Button onClick={() => void share()}>Share</Button> : null}
        </div>
      </Sheet>
    </>
  );
}
