export interface PageCta {
  label: string;
  href: string;
}

export interface PageSponsorLogo {
  src: string;
  alt: string;
}

export interface PageFaqItem {
  question: string;
  answer: string;
}

export interface PageTestimonial {
  id: number;
  name: string;
  designation: string | null;
  rating: number;
  text: string;
  photo: string | null;
}

export interface HeroBlock {
  type: "hero";
  title: string;
  subtitle: string;
  image: string | null;
  background: string | null;
  cta: PageCta | null;
}

export interface RichTextBlock {
  type: "rich_text";
  content: string;
}

export interface PopularCoursesBlock {
  type: "popular_courses";
  title: string;
  description: string;
  limit: number;
  cta: PageCta | null;
}

export interface MembershipBlock {
  type: "membership";
  title: string;
  description: string;
}

export interface TestimonialsBlock {
  type: "testimonials";
  title: string;
  limit: number;
  items: PageTestimonial[];
}

export interface SponsorsBlock {
  type: "sponsors";
  title: string;
  logos: PageSponsorLogo[];
}

export interface FaqBlock {
  type: "faq";
  title: string;
  items: PageFaqItem[];
}

export interface CtaBannerBlock {
  type: "cta_banner";
  title: string;
  text: string;
  image: string | null;
  button: PageCta | null;
}

/** Embeds a live Gravity Form (rendered via <GravityFormLoader>). */
export interface GravityFormBlock {
  type: "gravity_form";
  form_id: number;
  title: string;
}

/** Discriminated union of all landing-page block types (keys match the backend). */
export type PageBlock =
  | HeroBlock
  | RichTextBlock
  | PopularCoursesBlock
  | MembershipBlock
  | TestimonialsBlock
  | SponsorsBlock
  | FaqBlock
  | CtaBannerBlock
  | GravityFormBlock;

export interface PageContent {
  id: number;
  slug: string;
  title: string;
  template: string | null;
  isBlocks: boolean;
  content: string;
  excerpt: string;
  blocks: PageBlock[];
  /** Gravity Forms embedded via [gravityform] in the page content. */
  formIds: number[];
  modified: string | null;
}

export interface PageListItem {
  id: number;
  slug: string;
  title: string;
  template: string | null;
}
