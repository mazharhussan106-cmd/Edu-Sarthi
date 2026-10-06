// Owns turning a pasted video link into a safe embed address. Only YouTube and
// Google Drive links are accepted, and what is stored is always our own
// rebuilt embed URL — never the pasted text — so a card cannot make the page
// load an arbitrary site in a frame.
//
// It deliberately does not fetch the link or check the video exists or is
// shareable; a Drive file that is not shared simply shows Google's own message
// in the frame, and the editor tells the teacher to share it first.

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const DRIVE_ID = /^[A-Za-z0-9_-]{10,80}$/;

export function parseVideoUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\./, "").replace(/^m\./, "");

  let ytId: string | null = null;
  if (host === "youtu.be") ytId = url.pathname.split("/")[1] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "watch") ytId = url.searchParams.get("v");
    else if (["embed", "shorts", "live"].includes(parts[0])) ytId = parts[1] ?? null;
  }
  // youtube-nocookie: no tracking cookies until the viewer presses play.
  if (ytId && YT_ID.test(ytId)) return `https://www.youtube-nocookie.com/embed/${ytId}`;

  if (host === "drive.google.com") {
    const m = url.pathname.match(/^\/file\/d\/([^/]+)/);
    const id = m?.[1] ?? url.searchParams.get("id");
    if (id && DRIVE_ID.test(id)) return `https://drive.google.com/file/d/${id}/preview`;
  }
  return null;
}
