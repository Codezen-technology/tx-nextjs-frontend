import { decodeEntities } from "@/lib/api/parsers";
import { isExternalUrl, toFrontendPath } from "@/lib/utils/url";
import type { FooterData, FooterNavLink, WpNavItem } from "@/types/settings";

/**
 * Footer navigation column building.
 *
 * The backend (`Footer_Controller::build_nav_tree()`) serves the `footer-menu`
 * location as a NESTED tree: each top-level node is a section whose `items` are
 * its links. This module turns that tree into render-ready columns, and decides
 * when the backend gave us nothing usable and the static fallback must be shown.
 *
 * Kept out of `footer.tsx` (a server component) so it is directly unit-testable.
 */

/** A footer link with its destination already resolved to a final href. */
export interface FooterLink extends FooterNavLink {
  /** Render as a new-tab `<a>` rather than a `<Link>`. */
  external?: boolean;
  /** Stable React key — the WP menu item id when the link came from the menu. */
  key: string;
}

export interface FooterNavColumn {
  header?: string;
  links: FooterLink[];
}

/**
 * Static fallback shown when the backend supplies no usable menu. Unlike the
 * social fallback (deleted — invented URLs are dead links), these point at
 * routes this app genuinely serves, so the footer degrades to something that
 * works.
 *
 * Only list routes known to exist: `/careers` was removed because no such WP
 * page exists and the catch-all route 404s on it.
 */
export const FALLBACK_NAV_LINKS: FooterNavLink[] = [
  { href: "/about-us", label: "About us" },
  { href: "/resources", label: "Resources", badge: "New" },
  { href: "/force-for-good", label: "Force for Good" },
  { href: "/reviews", label: "Reviews" },
  { href: "/help", label: "Help and FAQs" },
  { href: "/contact-us", label: "Contact us" },
  { href: "/verify-certificate", label: "Verify certificate" },
  { href: "/cancellations", label: "Cancellations and refunds" },
  { href: "/terms-and-conditions", label: "Policies and terms of use" },
];

/** WP menu permalinks that differ from the headless route slug. */
const NAV_HREF_REMAP: Record<string, string> = {
  "/contact": "/contact-us",
  "/policies": "/privacy-policy",
};

/**
 * Resolve a WP menu URL to its final footer href.
 *
 * backend origin stripped → trailing slash dropped → legacy slug remapped.
 * The trailing slash matters: `trailingSlash` is not enabled, so `/about-us/`
 * would cost an extra redirect hop on every click.
 */
export function normaliseNavHref(url: string | null | undefined): string {
  const path = toFrontendPath(url);
  if (!path.startsWith("/")) return path; // external / unparseable — leave alone
  // Split off `?query` / `#hash` first: `/help/?topic=x` does not end in a
  // slash, so stripping the whole string would leave the redirect hop in place.
  const [, pathname, suffix] = /^([^?#]*)([\s\S]*)$/.exec(path) as RegExpExecArray;
  const trimmed = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return `${NAV_HREF_REMAP[trimmed] ?? trimmed}${suffix}`;
}

/** WP returns items in order, but the contract is `menu_order` — honour it. */
function byMenuOrder(a: WpNavItem, b: WpNavItem): number {
  return a.menu_order - b.menu_order;
}

function toLink(item: WpNavItem): FooterLink {
  const href = normaliseNavHref(item.url);
  return {
    // WP serves menu titles entity-encoded (`Terms &amp; Conditions`).
    label: decodeEntities(item.title),
    href,
    external: item.target === "_blank" || isExternalUrl(href),
    key: String(item.id),
  };
}

/** A top-level node is a section header when it has children, a link when not. */
function hasChildren(item: WpNavItem): boolean {
  return Array.isArray(item.items) && item.items.length > 0;
}

/**
 * An item with no destination cannot be rendered as a link — drop it.
 *
 * `#` is the giveaway: WP has no "heading" menu item type, so a section header
 * is authored as a Custom Link with `#` as its URL. Rendering those as links
 * would send every click to the top of the page, and — worse — would let a menu
 * of nothing but empty headers count as "has links" and suppress the fallback.
 */
function isRenderable(link: FooterLink): boolean {
  if (link.label === "") return false;
  const href = link.href.trim();
  return href !== "" && href !== "#" && !href.toLowerCase().startsWith("javascript:");
}

/**
 * Build columns from the nested WP tree.
 *
 * - node WITH children  → headed column (the header is plain text, matching the
 *   live site's "Quick links" / "Support" — it is not itself a link)
 * - run of consecutive childless nodes → one unheaded column
 * - an entirely flat menu → split across two unheaded columns, so a site that
 *   authored no nesting still gets the two-column footer layout rather than one
 *   long list
 */
function columnsFromTree(nav: WpNavItem[]): FooterNavColumn[] {
  const sorted = [...nav].sort(byMenuOrder);
  const columns: FooterNavColumn[] = [];
  let loose: FooterLink[] = [];

  const flushLoose = () => {
    if (loose.length === 0) return;
    columns.push({ links: loose });
    loose = [];
  };

  for (const item of sorted) {
    if (hasChildren(item)) {
      const links = [...(item.items ?? [])].sort(byMenuOrder).map(toLink).filter(isRenderable);
      if (links.length === 0) continue; // section authored but empty — nothing to show
      flushLoose();
      columns.push({ header: decodeEntities(item.title), links });
    } else {
      const link = toLink(item);
      if (isRenderable(link)) loose.push(link);
    }
  }
  flushLoose();

  // Fully flat menu — one unheaded column of everything. Split it in two.
  if (columns.length === 1 && !columns[0].header && columns[0].links.length > 1) {
    const links = columns[0].links;
    const mid = Math.ceil(links.length / 2);
    return [{ links: links.slice(0, mid) }, { links: links.slice(mid) }];
  }

  return columns;
}

/** Frontend-shaped link (fallback list / legacy payload) → renderable link. */
function toFrontendLink(l: FooterNavLink): FooterLink {
  const href = normaliseNavHref(l.href);
  return { ...l, href, external: isExternalUrl(href), key: l.href };
}

function fallbackColumns(): FooterNavColumn[] {
  return [
    { header: "About", links: FALLBACK_NAV_LINKS.slice(0, 5).map(toFrontendLink) },
    { header: "Support", links: FALLBACK_NAV_LINKS.slice(5).map(toFrontendLink) },
  ];
}

function countLinks(columns: FooterNavColumn[]): number {
  return columns.reduce((n, col) => n + col.links.length, 0);
}

/**
 * Turn the backend `nav` payload into footer columns, falling back to the
 * static link list whenever it yields no renderable links.
 *
 * The fallback trigger is deliberately "zero links", not "nav is falsy": the
 * bug this replaced checked `if (!nav)`, so a backend returning `nav: []` — an
 * assigned but empty `footer-menu`, which is what the live install actually had
 * — sailed past the guard and rendered two blank columns. Counting links also
 * covers the half-authored case of sections that exist but contain nothing.
 */
export function buildNavColumns(nav: FooterData["nav"] | undefined): FooterNavColumn[] {
  const columns = columnsFromPayload(nav);
  return countLinks(columns) > 0 ? columns : fallbackColumns();
}

function columnsFromPayload(nav: FooterData["nav"] | undefined): FooterNavColumn[] {
  if (!nav) return [];
  if (Array.isArray(nav)) return columnsFromTree(nav);

  // Legacy `{ about, support }` shape — links are already frontend-shaped. Runs
  // through the same renderable filter and empty-column drop as the tree branch,
  // so a half-populated payload cannot leave a header with no links under it.
  return [
    { header: "About", links: (nav.about ?? []).map(toFrontendLink).filter(isRenderable) },
    { header: "Support", links: (nav.support ?? []).map(toFrontendLink).filter(isRenderable) },
  ].filter((col) => col.links.length > 0);
}
