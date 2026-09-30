// Owns the browser-side media facts both the Uploader and the Recorder need:
// how long a file is, and which recording format this browser can produce.
//
// It deliberately holds no React and no upload logic. It is a set of pure
// browser helpers, so the two components that use it stay small and neither
// owns a workaround the other also needs.

/// MIME types MediaRecorder is asked for, best first.
///
/// Safari does not support audio/webm at all — it records audio/mp4 and
/// nothing else. Chrome and Firefox prefer webm. Asked for in order, so each
/// browser gets its native format rather than a conversion that does not exist.
const AUDIO_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
];

const VIDEO_CANDIDATES = [
  "video/webm;codecs=vp9,opus",
  "video/webm",
  "video/mp4",
];

export function pickRecordingType(kind: "AUDIO" | "VIDEO"): string | null {
  const candidates = kind === "AUDIO" ? AUDIO_CANDIDATES : VIDEO_CANDIDATES;

  // isTypeSupported is missing on very old browsers, where returning null
  // sends the user down the "upload a file instead" path rather than crashing.
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return null;
  }

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

/// The base MIME type without the codecs parameter. Storage and the database
/// want "audio/webm", not "audio/webm;codecs=opus".
export function baseType(mimeType: string): string {
  return mimeType.split(";")[0].trim();
}

export function extensionFor(mimeType: string): string {
  const map: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "video/webm": "webm",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  return map[baseType(mimeType)] ?? "bin";
}

/// Reads a media file's length in whole seconds. Returns null when the browser
/// cannot work it out — an unreadable duration is not a reason to block a
/// submission, it just means the length is not displayed.
export function readDuration(source: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    if (!source.type.startsWith("audio") && !source.type.startsWith("video")) {
      resolve(null);
      return;
    }

    const url = URL.createObjectURL(source);
    const el = document.createElement(
      source.type.startsWith("video") ? "video" : "audio",
    );

    // Object URLs are not garbage collected. Every path out of here has to
    // revoke, or a student who retakes ten times leaks ten recordings.
    const finish = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };

    // Nothing fires on a corrupt file, so the promise would hang and the
    // submit button would stay disabled with no explanation.
    const timeout = setTimeout(() => finish(null), 5000);

    el.preload = "metadata";

    el.onloadedmetadata = () => {
      // Chrome reports Infinity for a MediaRecorder blob until the element has
      // been seeked past the end — the header has no duration in it, because
      // the recorder was still writing when it was created. Seeking to an
      // absurd position forces the browser to scan and produce a real number.
      if (el.duration === Infinity) {
        el.currentTime = Number.MAX_SAFE_INTEGER;
        el.ontimeupdate = () => {
          el.ontimeupdate = null;
          clearTimeout(timeout);
          finish(Number.isFinite(el.duration) ? Math.round(el.duration) : null);
        };
        return;
      }

      clearTimeout(timeout);
      finish(Number.isFinite(el.duration) ? Math.round(el.duration) : null);
    };

    el.onerror = () => {
      clearTimeout(timeout);
      finish(null);
    };

    el.src = url;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
