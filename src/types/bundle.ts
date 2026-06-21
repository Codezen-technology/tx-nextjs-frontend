import type { Course } from "./course";

export interface BundleImage {
  full?: string;
  large?: string;
  thumb?: string;
}

export interface BundlePricing {
  price: number | null;
  regularPrice: number | null;
  salePrice: number | null;
  isOnSale: boolean;
  currency: string;
  priceHtml: string;
}

export interface BundleRating {
  average: number;
  count: number;
}

export interface BundleCoursePreview {
  id: number;
  title: string;
  slug: string;
}

/** Archive / listing card. */
export interface Bundle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  image: BundleImage | null;
  pricing: BundlePricing;
  rating: BundleRating;
  includedCoursesCount: number;
  coursesPreview: BundleCoursePreview[];
}

export interface BundleFaqItem {
  question: string;
  answer: string;
}

export interface BundleCourseCard {
  title: string;
  shortDescription: string;
}

/** Single-bundle detail. */
export interface BundleDetail extends Bundle {
  content: string;
  objectives: string | null;
  standards: string | null;
  courseFor: string | null;
  faq: BundleFaqItem[];
  includedCourses: Course[];
  includedCoursesCards: BundleCourseCard[];
  totalDurationSeconds: number;
  totalDurationHours: number;
  cpdPoints: number;
  benefits: string[];
  lastUpdate: string | null;
}
