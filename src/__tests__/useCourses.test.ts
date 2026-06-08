import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCourses, useCourse } from "@/lib/hooks/useCourses";
import { createWrapper } from "./test-utils";
import { makeCourse } from "./fixtures/courses";
import type { PaginatedResponse } from "@/types/api";
import type { Course } from "@/types/course";

vi.mock("@/lib/services/courses", () => ({
  coursesService: {
    list: vi.fn(),
    detail: vi.fn(),
    curriculum: vi.fn(),
    categories: vi.fn(),
    reviews: vi.fn(),
    related: vi.fn(),
    richDetail: vi.fn(),
    sections: vi.fn(),
    featured: vi.fn(),
  },
  normalizeCourse: vi.fn((x: unknown) => x),
  normalizeRichCourse: vi.fn((x: unknown) => x),
  resolveCourseProductId: vi.fn(() => null),
}));

import { coursesService } from "@/lib/services/courses";

const mockList = coursesService.list as ReturnType<typeof vi.fn>;
const mockDetail = coursesService.detail as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockList.mockReset();
  mockDetail.mockReset();
});

const paginatedResponse = (items: Course[]): PaginatedResponse<Course> => ({
  items,
  total: items.length,
  page: 1,
  perPage: 12,
  totalPages: 1,
});

describe("useCourses", () => {
  it("returns course list data", async () => {
    const courses = [makeCourse({ id: 1, title: "Alpha" }), makeCourse({ id: 2, title: "Beta" })];
    mockList.mockResolvedValueOnce(paginatedResponse(courses));

    const { result } = renderHook(() => useCourses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(2);
    expect(result.current.data?.items[0].title).toBe("Alpha");
  });

  it("starts in loading state", () => {
    mockList.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useCourses(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  it("enters error state when service rejects", async () => {
    mockList.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useCourses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("passes filters to the service", async () => {
    mockList.mockResolvedValueOnce(paginatedResponse([]));

    const filters = { category: "dev", page: 2 };
    renderHook(() => useCourses(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(mockList).toHaveBeenCalledWith(filters));
  });
});

describe("useCourse", () => {
  it("returns single course by slug", async () => {
    const course = makeCourse({ id: 10, slug: "my-course", title: "My Course" });
    mockDetail.mockResolvedValueOnce(course);

    const { result } = renderHook(() => useCourse("my-course"), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.title).toBe("My Course");
  });

  it("does not fetch when disabled", () => {
    const { result } = renderHook(() => useCourse("slug", { enabled: false }), {
      wrapper: createWrapper(),
    });
    expect(result.current.isFetching).toBe(false);
    expect(mockDetail).not.toHaveBeenCalled();
  });
});
