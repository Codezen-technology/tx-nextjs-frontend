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
}

/** Merged effective settings: API response overridden by env vars. */
export type EffectiveSettings = SiteSettings;
