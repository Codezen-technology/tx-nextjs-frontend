export interface SiteFeatures {
  memberships: boolean;
  bundles: boolean;
  certificates: boolean;
  badges: boolean;
  reviews: boolean;
  blog: boolean;
}

export interface SiteSocial {
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

export interface FooterNavLink {
  label: string;
  href: string;
  badge?: string;
}

export interface WpNavItem {
  id: number;
  title: string;
  url: string;
  slug: string | null;
  object_type: string;
  object_id: number;
  target: string | null;
  classes: string[];
  description: string | null;
  menu_order: number;
  /**
   * Present on top-level nodes only — `Footer_Controller::build_nav_tree()`
   * attaches `items` when it assembles sections, while `format_nav_item()`
   * (used for children) omits the key entirely.
   */
  items?: WpNavItem[];
}

/**
 * Accreditation badge shown in the footer. `src` is already resolved to an
 * absolute URL by the backend (`Media_Path`), so it may live on the WP origin
 * or on the S3 media host — both are in `next.config.mjs` `remotePatterns`. A
 * badge served from any other host must have that host added there first.
 */
export interface FooterBadge {
  src: string;
  alt?: string | null;
}

export interface FooterData {
  nav: WpNavItem[] | { about: FooterNavLink[]; support: FooterNavLink[] };
  social: {
    facebook?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
  };
  contact: {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    /** Brand blurb rendered beside the logo — `wp_option lms_footer_description`. */
    description?: string | null;
  };
  /** `wp_option lms_footer_badges`; absent on older backends. */
  compliance?: {
    badges: FooterBadge[];
  };
}

export interface MembershipUpsell {
  product_id: number;
  name: string;
  price: number;
  regular_price: number;
  currency: string;
  badge: string | null;
  features: string[];
  permalink: string | null;
}

/** Student-dashboard sidebar promo banner (admin "Promo banner" settings). */
export interface PromoBanner {
  title: string;
  subtitle: string;
  /** Custom uploaded image; null → frontend uses its built-in graphic. */
  image_url: string | null;
  /** Linked WooCommerce product; null when none configured. */
  product_id: number | null;
  price: number | null;
  regular_price: number | null;
  currency: string;
  button_url: string | null;
}

/**
 * Sitewide floating notice bar, as served on `GET /settings`.
 *
 * Generic chrome by design — an intake deadline, a promotion, a service notice.
 * The WP → Next.js migration notice is one thing to put in it, not what it is.
 * Owned by `wp-lms-backend-rest-api`; `docs/SETTINGS_API.md` in that repo is the
 * binding contract, so check it before changing anything here.
 *
 * The backend has already decided whether to show a bar by the time we see it:
 * unconfigured, switched off, or an empty message all arrive as `null`, and the
 * key is present on every response. So there is no `enabled` flag to read — the
 * value being non-null IS the flag.
 *
 * This is the RAW shape. `mergeSettings()` narrows it into {@link FloatingBar}.
 */
export interface RawFloatingBar {
  /** Plain text. The backend strips markup rather than escaping it. */
  message?: string;
  cta?: { label?: string; href?: string } | null;
  /** Whether the client may offer a dismiss control. */
  dismissible?: boolean;
  /**
   * Opaque, stable fingerprint of this bar's own content. Persist a dismissal
   * against it and treat it as opaque — never parse it. Edited copy yields a
   * different key, which is what brings the bar back for someone who dismissed
   * the previous notice.
   */
  dismiss_key?: string;
}

/** Normalised, render-ready bar. Its existence means "show this". */
export interface FloatingBar {
  /** Entity-decoded plain text. Rendered as a text node, never as HTML. */
  message: string;
  /** Present only when the backend served BOTH a label and a safe href. */
  cta?: { href: string; label: string };
  /**
   * Present only when this bar may be dismissed AND the backend supplied a key
   * to remember the dismissal by. The backend's `dismissible` and `dismiss_key`
   * are collapsed into this one field because either alone is meaningless: a
   * dismissible bar with no key returns on the next page load, and a key on a
   * non-dismissible bar is never read. Its presence IS "show a dismiss control".
   */
  dismissKey?: string;
}

export interface SiteSettings {
  site_name: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  og_image_url?: string;
  primary_color?: string;
  accent_color?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  social?: SiteSocial;
  currency: string;
  locale: string;
  features: SiteFeatures;
  membership_upsell?: MembershipUpsell | null;
  promo_banner?: PromoBanner | null;
  floating_bar?: FloatingBar;
}

/** Merged effective settings: API response overridden by env vars. */
export type EffectiveSettings = SiteSettings;

/**
 * The `/settings` payload as it arrives from WordPress.
 *
 * Identical to `Partial<SiteSettings>` except for `floating_bar`, which the
 * backend sends in its raw shape and `mergeSettings()` narrows on the way in.
 */
export type ApiSiteSettings = Omit<Partial<SiteSettings>, "floating_bar"> & {
  floating_bar?: RawFloatingBar | null;
};
