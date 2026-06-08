import type { Course, CourseRichData } from "@/types/course";

export function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 1,
    slug: "test-course",
    title: "Test Course",
    excerpt: "A great course for testing",
    content: "<p>Course content here</p>",
    featuredImage: "https://example.com/image.jpg",
    price: 99,
    isFree: false,
    studentsCount: 100,
    rating: 4.5,
    ratingCount: 20,
    unitsCount: 10,
    ...overrides,
  };
}

export function makeRichCourse(overrides: Partial<CourseRichData> = {}): CourseRichData {
  return {
    ...makeCourse(overrides),
    product_id: 42,
    duration: null,
    pricing: {
      product_id: 42,
      regular_price: 129,
      sale_price: 99,
      price: 99,
      is_on_sale: true,
      currency: "GBP",
      price_html: "£99.00",
      sale_price_html: "£99.00",
    },
    accreditations: [],
    experts: [],
    badges: [],
    breadcrumb: [],
    cpd_points: undefined,
    announcement: null,
    video_url: null,
    course_type: undefined,
    ...overrides,
  };
}

export function makeRankMathHead(
  opts: Partial<{
    title: string;
    description: string;
    canonical: string;
    ogImage: string;
    ogType: string;
  }> = {},
): string {
  const {
    title = "Test Page — Training Excellence",
    description = "Test meta description",
    canonical = "https://example.com/test",
    ogImage,
    ogType = "website",
  } = opts;
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    ogImage ? `<meta property="og:image" content="${ogImage}" />` : "",
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
  ]
    .filter(Boolean)
    .join("\n");
}
