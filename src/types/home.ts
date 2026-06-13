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

/** Static hero headline content — not yet returned by GET /home/hero (slides-only). */
export interface HomeHeroContent {
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

export interface HomePricingFeature {
  label: string;
  included: boolean;
}

export interface HomePricingPlan {
  name: string;
  subtitle?: string;
  price: string;
  priceUnit?: string;
  originalPrice?: string;
  badge?: "best-value" | "most-popular";
  ctaHref: string;
  ctaLabel: string;
  variant: "default" | "beige" | "navy";
  features: HomePricingFeature[];
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

export interface HomeTrustedOrg {
  src: string;
  alt: string;
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
  hero: HomeWhyPanel[];
  pricing: HomePricingSection;
  trusted_orgs: HomeTrustedOrg[];
  popular_courses_header: HomePopularCoursesHeader;
  why: HomeWhyPanel[];
  testimonials: HomeTestimonial[];
}
