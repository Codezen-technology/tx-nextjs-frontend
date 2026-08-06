import { describe, it, expect } from "vitest";
import {
  normalizeCourse,
  normalizeFlatCurriculum,
  normalizeRichCourse,
} from "@/lib/services/courses";

describe("normalizeCourse", () => {
  it("maps id and slug", () => {
    const c = normalizeCourse({ id: 5, slug: "my-course" } as never);
    expect(c.id).toBe(5);
    expect(c.slug).toBe("my-course");
  });

  it("falls back to string id when slug is missing", () => {
    const c = normalizeCourse({ id: 7 } as never);
    expect(c.slug).toBe("7");
  });

  it("decodes title from WP rendered object", () => {
    const c = normalizeCourse({ id: 1, title: { rendered: "Course &amp; More" } } as never);
    expect(c.title).toBe("Course & More");
  });

  it("falls back to name field for title", () => {
    const c = normalizeCourse({ id: 1, name: "Course Name" } as never);
    expect(c.title).toBe("Course Name");
  });

  it("returns 'Untitled' when no title or name", () => {
    const c = normalizeCourse({ id: 1 } as never);
    expect(c.title).toBe("Untitled");
  });

  it("maps average_rating field (real API field name)", () => {
    const c = normalizeCourse({ id: 1, average_rating: 4.5, rating_count: 10 } as never);
    expect(c.rating).toBe(4.5);
    expect(c.ratingCount).toBe(10);
  });

  it("falls back to rating field (legacy)", () => {
    const c = normalizeCourse({ id: 1, rating: 3.8 } as never);
    expect(c.rating).toBe(3.8);
  });

  it("maps total_students (real API) to studentsCount", () => {
    const c = normalizeCourse({ id: 1, total_students: 200 } as never);
    expect(c.studentsCount).toBe(200);
  });

  it("falls back to students_count (legacy)", () => {
    const c = normalizeCourse({ id: 1, students_count: 50 } as never);
    expect(c.studentsCount).toBe(50);
  });

  it("resolves featured_image as object with full/medium/thumbnail", () => {
    const c = normalizeCourse({
      id: 1,
      featured_image: {
        full: "https://cdn.example.com/full.jpg",
        thumbnail: "https://cdn.example.com/thumb.jpg",
      },
    } as never);
    expect(c.featuredImage).toBe("https://cdn.example.com/full.jpg");
  });

  it("resolves featured_image as plain string", () => {
    const c = normalizeCourse({
      id: 1,
      featured_image: "https://cdn.example.com/img.jpg",
    } as never);
    expect(c.featuredImage).toBe("https://cdn.example.com/img.jpg");
  });

  it("converts price string to number", () => {
    const c = normalizeCourse({ id: 1, price: "49.99" } as never);
    expect(c.price).toBe(49.99);
  });

  it("marks free courses when price is 0", () => {
    const c = normalizeCourse({ id: 1, price: 0 } as never);
    expect(c.isFree).toBe(true);
  });

  it("uses is_free flag over price check", () => {
    const c = normalizeCourse({ id: 1, price: 99, is_free: true } as never);
    expect(c.isFree).toBe(true);
  });

  it("converts Unix timestamp date_created to ISO string", () => {
    const c = normalizeCourse({ id: 1, date_created: 1700000000 } as never);
    expect(c.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("maps instructors array primary instructor", () => {
    const c = normalizeCourse({
      id: 1,
      primary_instructor: {
        id: 10,
        display_name: "Jane Doe",
        avatar_url: "https://cdn.example.com/a.jpg",
      },
    } as never);
    expect(c.instructor?.name).toBe("Jane Doe");
    expect(c.instructor?.avatar).toBe("https://cdn.example.com/a.jpg");
  });

  it("no instructor when none present", () => {
    const c = normalizeCourse({ id: 1 } as never);
    expect(c.instructor).toBeUndefined();
  });

  it("sets product_id when valid numeric value", () => {
    const c = normalizeCourse({ id: 1, product_id: 42 } as never);
    expect(c.product_id).toBe(42);
  });

  it("sets product_id to null when 0 or absent", () => {
    expect(normalizeCourse({ id: 1, product_id: 0 } as never).product_id).toBeNull();
    expect(normalizeCourse({ id: 1 } as never).product_id).toBeNull();
  });
});

describe("normalizeRichCourse", () => {
  it("includes all base course fields", () => {
    const c = normalizeRichCourse({ id: 3, slug: "rich", title: "Rich Course" });
    expect(c.id).toBe(3);
    expect(c.slug).toBe("rich");
    expect(c.title).toBe("Rich Course");
  });

  it("maps pricing block", () => {
    const c = normalizeRichCourse({
      id: 1,
      pricing: {
        product_id: 55,
        regular_price: 129,
        sale_price: 99,
        price: 99,
        is_on_sale: true,
        currency: "GBP",
        price_html: "£99",
        sale_price_html: "£99",
      },
    });
    expect(c.pricing?.product_id).toBe(55);
    expect(c.pricing?.is_on_sale).toBe(true);
    expect(c.pricing?.currency).toBe("GBP");
  });

  it("sets pricing to null when absent", () => {
    expect(normalizeRichCourse({ id: 1 }).pricing).toBeNull();
  });

  it("maps accreditations array", () => {
    const accreditations = [{ slug: "cpd", label: "CPD", logo: "logo.png", description: "" }];
    const c = normalizeRichCourse({ id: 1, accreditations });
    expect(c.accreditations).toHaveLength(1);
    expect(c.accreditations?.[0].slug).toBe("cpd");
  });

  it("defaults accreditations to empty array", () => {
    expect(normalizeRichCourse({ id: 1 }).accreditations).toEqual([]);
  });

  it("maps cpd_points", () => {
    const c = normalizeRichCourse({ id: 1, cpd_points: 3 });
    expect(c.cpd_points).toBe(3);
  });

  it("maps announcement string", () => {
    const c = normalizeRichCourse({ id: 1, announcement: "Limited seats!" });
    expect(c.announcement).toBe("Limited seats!");
  });

  it("sets announcement to null for empty string", () => {
    expect(normalizeRichCourse({ id: 1, announcement: "" }).announcement).toBeNull();
  });

  it("resolves product_id from pricing block when top-level absent", () => {
    const c = normalizeRichCourse({
      id: 1,
      pricing: {
        product_id: 77,
        regular_price: 100,
        sale_price: 0,
        price: 100,
        is_on_sale: false,
        currency: "GBP",
        price_html: "",
        sale_price_html: "",
      },
    });
    expect(c.product_id).toBe(77);
  });
});

describe("normalizeFlatCurriculum", () => {
  it("converts section_duration from minutes to seconds", () => {
    const [section] = normalizeFlatCurriculum([
      { id: 1, title: "Intro", type: "section", section_duration: 90 },
    ]);
    expect(section.section_duration).toBe(5400);
  });

  it("converts unit duration from minutes to seconds", () => {
    const [unit] = normalizeFlatCurriculum([
      { id: 2, title: "Lesson 1", type: "unit", duration: 12 },
    ]);
    expect(unit.duration).toBe(720);
  });

  it("leaves missing durations untouched", () => {
    const [section, unit] = normalizeFlatCurriculum([
      { id: 1, title: "Intro", type: "section" },
      { id: 2, title: "Lesson 1", type: "unit", duration: null },
    ]);
    expect(section.section_duration).toBeUndefined();
    expect(unit.duration).toBeNull();
  });

  it("keeps zero as zero rather than dropping it", () => {
    const [unit] = normalizeFlatCurriculum([
      { id: 2, title: "Lesson 1", type: "unit", duration: 0 },
    ]);
    expect(unit.duration).toBe(0);
  });

  it("preserves every other field", () => {
    const [unit] = normalizeFlatCurriculum([
      { id: 3, title: "Quiz", type: "quiz", icon: "quiz", is_free_preview: true, duration: 5 },
    ]);
    expect(unit).toMatchObject({
      id: 3,
      title: "Quiz",
      type: "quiz",
      icon: "quiz",
      is_free_preview: true,
      duration: 300,
    });
  });

  it("returns an empty array unchanged", () => {
    expect(normalizeFlatCurriculum([])).toEqual([]);
  });
});
