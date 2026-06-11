/** One postMessage subscription per iframe — no @vimeo/player constructor (avoids repeat API handshakes). */

const subscribedIframes = new WeakSet<HTMLIFrameElement>();

function parseVimeoMessage(data: unknown): { event?: string } | null {
  if (!data) return null;
  try {
    return typeof data === "string"
      ? (JSON.parse(data) as { event?: string })
      : (data as { event?: string });
  } catch {
    return null;
  }
}

/**
 * Listen for Vimeo `ended`/`finish` via postMessage (requires `api=1` on embed URL).
 * Returns cleanup; safe to call only once per iframe (guarded internally).
 */
export function bindVimeoEnded(iframe: HTMLIFrameElement, onEnded: () => void): () => void {
  if (!iframe.src.includes("vimeo.com")) return () => undefined;

  const subscribe = () => {
    if (subscribedIframes.has(iframe)) return;
    subscribedIframes.add(iframe);
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: "addEventListener", value: "ended" }),
      "*",
    );
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: "addEventListener", value: "finish" }),
      "*",
    );
  };

  if (iframe.contentDocument?.readyState === "complete") {
    subscribe();
  } else {
    iframe.addEventListener("load", subscribe, { once: true });
  }

  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow) return;
    const payload = parseVimeoMessage(event.data);
    if (payload?.event === "ended" || payload?.event === "finish") onEnded();
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
