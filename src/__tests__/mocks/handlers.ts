import { http, HttpResponse } from "msw";

const WP_BASE = "http://localhost/wp-json";
const LMS = `${WP_BASE}/lms-backend/v1`;
const RANKMATH = `${WP_BASE}/rankmath/v1`;

export const handlers = [
  http.get(`${LMS}/courses`, () =>
    HttpResponse.json({
      success: true,
      data: {
        items: [
          {
            id: 1,
            slug: "test-course",
            title: "Test Course",
            excerpt: "A test course",
            price: 99,
            total_students: 100,
            average_rating: 4.5,
            rating_count: 20,
          },
        ],
        total: 1,
        page: 1,
        per_page: 12,
        total_pages: 1,
      },
    }),
  ),

  http.get(`${LMS}/courses/slug/:slug`, ({ params }) =>
    HttpResponse.json({
      success: true,
      data: {
        id: 1,
        slug: params.slug,
        title: "Test Course",
        excerpt: "A test course excerpt",
        price: 99,
        total_students: 100,
        average_rating: 4.5,
        rating_count: 20,
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
      },
    }),
  ),

  http.get(`${RANKMATH}/getHead`, ({ request }) => {
    const url = new URL(request.url);
    const pageUrl = url.searchParams.get("url") ?? "";
    return HttpResponse.json({
      success: true,
      head: `<title>Test Page — Training Excellence</title>
<meta name="description" content="Test description" />
<link rel="canonical" href="${pageUrl}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Test Page" />`,
    });
  }),

  http.get(`${LMS}/settings`, () =>
    HttpResponse.json({
      success: true,
      data: {
        site_name: "Training Excellence",
        logo_url: "",
        features: {},
      },
    }),
  ),
];
