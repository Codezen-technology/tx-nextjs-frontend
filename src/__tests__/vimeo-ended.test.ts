import { describe, expect, it } from "vitest";
import { findVimeoIframe, getIframeSrc, isVimeoIframe } from "@/lib/player/vimeo-ended";
import { getNextIncompleteUnit } from "@/lib/player/progress";
import { PlayerItemType, type IPlayerUnit } from "@/types/player";

describe("findVimeoIframe", () => {
  it("finds player.vimeo.com iframe by attribute src", () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<div class="wp-block-embed"><iframe src="https://player.vimeo.com/video/123" /></div>';
    const iframe = findVimeoIframe(root);
    expect(iframe).not.toBeNull();
    expect(isVimeoIframe(iframe!)).toBe(true);
    expect(getIframeSrc(iframe!)).toContain("player.vimeo.com");
  });

  it("returns null when no vimeo iframe", () => {
    const root = document.createElement("div");
    root.innerHTML = '<iframe src="https://www.youtube.com/embed/abc" />';
    expect(findVimeoIframe(root)).toBeNull();
  });
});

describe("getNextIncompleteUnit", () => {
  const unit = (id: number, status = 0): IPlayerUnit => ({
    key: id,
    id,
    type: PlayerItemType.Unit,
    title: `Unit ${id}`,
    duration: 60,
    unit_type: "unit",
    content: "",
    status,
    icon: "",
    meta: [],
  });

  it("skips completed units and returns next incomplete", () => {
    const items = [unit(1, 1), unit(2, 1), unit(3, 0), unit(4, 0)];
    expect(getNextIncompleteUnit(items, 1)?.id).toBe(3);
  });

  it("returns null when no incomplete units remain", () => {
    const items = [unit(1, 1), unit(2, 1)];
    expect(getNextIncompleteUnit(items, 1)).toBeNull();
  });
});
