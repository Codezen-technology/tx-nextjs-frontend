import Player from "@vimeo/player";

const activePlayers = new WeakMap<HTMLIFrameElement, Player>();

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

function once(fn: () => void): () => void {
  let fired = false;
  return () => {
    if (fired) return;
    fired = true;
    fn();
  };
}

/** Resolve Vimeo iframe src from property or attribute (innerHTML may not set .src immediately). */
export function getIframeSrc(iframe: HTMLIFrameElement): string {
  return iframe.src || iframe.getAttribute("src") || "";
}

export function isVimeoIframe(iframe: HTMLIFrameElement): boolean {
  const src = getIframeSrc(iframe);
  return src.includes("vimeo.com") || src.includes("player.vimeo");
}

/** First Vimeo iframe in tree (prefers player.vimeo.com). */
export function findVimeoIframe(root: ParentNode): HTMLIFrameElement | null {
  const iframes = Array.from(root.querySelectorAll<HTMLIFrameElement>("iframe"));
  let fallback: HTMLIFrameElement | null = null;

  for (const iframe of iframes) {
    const src = getIframeSrc(iframe);
    if (src.includes("player.vimeo")) return iframe;
    if (src.includes("vimeo.com")) fallback = iframe;
  }

  return fallback;
}

/** Append `api=1` so postMessage events work (SDK also does this). */
export function ensureVimeoApi(iframe: HTMLIFrameElement): void {
  const raw = getIframeSrc(iframe);
  if (!raw || raw.includes("api=1")) return;

  try {
    const url = new URL(raw, window.location.href);
    url.searchParams.set("api", "1");
    iframe.src = url.toString();
  } catch {
    // ignore malformed src
  }
}

function bindVimeoPostMessage(iframe: HTMLIFrameElement, onEnded: () => void): () => void {
  ensureVimeoApi(iframe);
  const fireOnce = once(onEnded);
  const controller = new AbortController();
  let subscribed = false;

  const subscribe = () => {
    if (subscribed) return;
    subscribed = true;
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: "addEventListener", value: "ended" }),
      "*",
    );
    iframe.contentWindow?.postMessage(
      JSON.stringify({ method: "addEventListener", value: "finish" }),
      "*",
    );
  };

  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow) return;
    const payload = parseVimeoMessage(event.data);
    if (!payload?.event) return;
    if (payload.event === "ready") subscribe();
    if (payload.event === "ended" || payload.event === "finish") fireOnce();
  };

  window.addEventListener("message", onMessage, { signal: controller.signal });
  iframe.addEventListener("load", subscribe, { once: true, signal: controller.signal });

  return () => controller.abort();
}

/**
 * Bind Vimeo `ended` — uses @vimeo/player (same as WP plugin), postMessage fallback.
 * Safe to call once per iframe per unit mount; cleans up on return.
 */
export function bindVimeoEnded(iframe: HTMLIFrameElement, onEnded: () => void): () => void {
  if (!isVimeoIframe(iframe)) return () => undefined;

  try {
    const player = activePlayers.get(iframe) ?? new Player(iframe);
    activePlayers.set(iframe, player);

    const fireOnce = once(onEnded);
    const handler = () => fireOnce();
    player.on("ended", handler);

    return () => {
      player.off("ended", handler);
    };
  } catch {
    return bindVimeoPostMessage(iframe, onEnded);
  }
}
