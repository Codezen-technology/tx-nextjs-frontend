export interface HomeTopbarItem {
  label: string;
  icon: string;
}

export interface HomeHeroAccreditation {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
}

export interface HomeHeroHeadline {
  title: string;
  description: string;
  accreditations: HomeHeroAccreditation[];
}

export interface HomeCta {
  label: string;
  href: string;
}

export interface HomeWhyPanel {
  side: "left" | "right";
  title: string;
  body?: string;
  bullets?: string[];
  cta: HomeCta;
  gif: string;
  gifAlt: string;
}

/** "Why Choose Us" icon-grid item (redesigned homepage) — icon is a lucide-react icon name. */
export interface HomeWhyFeature {
  icon: string;
  title: string;
  description: string;
}

export interface HomeIconBullet {
  icon: string;
  title: string;
  description: string;
}

/** "Transform Your Team With Us" B2B teaser. */
export interface HomeTeamSection {
  title: string;
  description: string;
  bullets: HomeIconBullet[];
  images: string[];
  cta: HomeCta;
}

/** "CPD Accredited Certificate & Transcript" teaser. */
export interface HomeCertificateSection {
  title: string;
  description: string;
  images: string[];
  cta: HomeCta;
}

export interface HomePricingFeature {
  label: string;
  included: boolean;
}

export interface HomePricingProduct {
  id: number;
  name: string;
  price: number | null;
  priceFormatted: string | null;
  regularPrice: number | null;
  regularPriceFormatted: string | null;
  salePrice: number | null;
  isOnSale: boolean;
  currency: string;
  permalink: string;
  addToCartUrl: string;
}

export interface HomePricingPlan {
  name: string;
  subtitle?: string;
  price: string;
  priceUnit?: string;
  originalPrice?: string;
  badge?: "best-value" | "most-popular";
  ctaHref?: string;
  ctaLabel: string;
  variant: "default" | "beige" | "navy";
  features: HomePricingFeature[];
  product?: HomePricingProduct;
}

export interface HomePricingSection {
  header: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  plans: HomePricingPlan[];
}

export interface HomeFaqItem {
  question: string;
  answer: string;
}

export interface HomeTrustedOrg {
  src: string;
  alt: string;
}

export interface HomeTrustedOrgsSection {
  header: { title: string };
  orgs: HomeTrustedOrg[];
}

export interface HomePopularCoursesHeader {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface HomeTestimonial {
  id: number;
  name: string;
  designation: string | null;
  rating: number;
  text: string;
  photo: string | null;
}

export interface HomePageData {
  topbar: HomeTopbarItem[];
  /** Legacy alternating slide format — unused by the redesigned homepage, kept for other consumers. */
  hero: HomeWhyPanel[];
  hero_headline: HomeHeroHeadline;
  pricing: HomePricingSection;
  trusted_orgs: HomeTrustedOrgsSection;
  popular_courses_header: HomePopularCoursesHeader;
  why: HomeWhyFeature[];
  team: HomeTeamSection;
  certificate: HomeCertificateSection;
  testimonials: HomeTestimonial[];
}

/** Dedicated /pricing page payload (decoupled from home). */
export interface PricingPageData {
  pricing: HomePricingSection;
  faq: HomeFaqItem[];
}
