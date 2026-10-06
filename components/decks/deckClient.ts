// Owns the browser side of talking to the deck APIs: JSON calls that never
// throw, and the two-step media upload (get a signed URL, PUT the file).
//
// Every response is read as text first: a serverless timeout returns an HTML
// page, and a bare res.json() on that tells the student nothing.
// It deliberately holds no React state; the components decide what to show.

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function callApi<T = Record<string, unknown>>(url: string, body: object): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Something went wrong. Try again in a moment." };
    }
    if (!res.ok) return { ok: false, error: typeof data.error === "string" ? data.error : "Could not save. Try again." };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "No connection. Nothing was saved — try again when you are back online." };
  }
}

function put(url: string, file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.ontimeout = () => resolve(false);
    xhr.send(file);
  });
}

/// Uploads one picture or recording and returns its storage key.
export async function uploadMedia(file: File, kind: "IMAGE" | "AUDIO"): Promise<ApiResult<{ key: string }>> {
  // "audio/webm;codecs=opus" → "audio/webm": the API matches the bare type.
  const contentType = file.type.split(";")[0].trim();
  const target = await callApi<{ key: string; url: string }>("/api/decks/media", {
    kind,
    filename: file.name || (kind === "IMAGE" ? "picture.jpg" : "recording.webm"),
    contentType,
    sizeBytes: file.size,
  });
  if (!target.ok) return target;
  const typed = file.type === contentType ? file : new File([file], file.name, { type: contentType });
  if (!(await put(target.data.url, typed))) {
    return { ok: false, error: `The ${kind === "IMAGE" ? "picture" : "recording"} did not upload. Check your connection and save again.` };
  }
  return { ok: true, data: { key: target.data.key } };
}
