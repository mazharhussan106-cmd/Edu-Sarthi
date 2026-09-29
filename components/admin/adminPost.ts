// Owns the fetch every admin form uses: POST JSON, parse the reply
// defensively, and return either the data or a message to show.

export async function adminPost<T = Record<string, unknown>>(
  url: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    let data: T & { error?: string };
    try {
      data = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Something went wrong. Try again." };
    }
    return res.ok ? { ok: true, data } : { ok: false, error: data.error ?? "That did not work. Try again." };
  } catch {
    return { ok: false, error: "Could not reach the server. Try again." };
  }
}
