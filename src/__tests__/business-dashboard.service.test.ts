import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { businessDashboardService } from "@/lib/services/business-dashboard";

// The service is the only layer allowed to know about WP's shape. These tests
// cover the two things it hides from every component: entity-encoded `rendered`
// strings, and list keys that differ between backend builds.

const fetchMock = vi.fn();

function res(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: { get: () => null },
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

/** The path the service actually called, so param plumbing can be asserted. */
function calledPath(): string {
  return fetchMock.mock.calls[0][0] as string;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("decoding WP rendered strings", () => {
  it("decodes course names in the assignment list", async () => {
    fetchMock.mockReturnValueOnce(
      res({ items: [{ course_id: 1, course_name: "Fire &amp; Rescue" }], total: 1 }),
    );

    const result = await businessDashboardService.getAssignmentList();

    expect(result.items[0].course_name).toBe("Fire & Rescue");
  });

  it("decodes the catalogue's name, excerpt and author", async () => {
    fetchMock.mockReturnValueOnce(
      res({
        courses: [
          {
            id: 9,
            name: "Learner&#8217;s Guide",
            excerpt: "Health &amp; Safety",
            author: "O&#8217;Brien",
            course_categories: [{ id: 3, name: "Health &amp; Safety" }],
          },
        ],
        total: 1,
      }),
    );

    const result = await businessDashboardService.getCourses();

    expect(result.courses[0].name).toBe("Learner’s Guide");
    expect(result.courses[0].excerpt).toBe("Health & Safety");
    expect(result.courses[0].author).toBe("O’Brien");
    expect(result.courses[0].course_categories?.[0].name).toBe("Health & Safety");
  });

  it("leaves an absent optional field absent rather than turning it into an empty string", async () => {
    fetchMock.mockReturnValueOnce(res({ courses: [{ id: 9, name: "Fire" }], total: 1 }));

    const result = await businessDashboardService.getCourses();

    expect(result.courses[0].excerpt).toBeUndefined();
    expect(result.courses[0].author).toBeUndefined();
  });

  it("decodes course and learner names on the certificate register", async () => {
    fetchMock.mockReturnValueOnce(
      res({
        items: [
          {
            id: "900_42",
            course: { id: 900, name: "Fire &amp; Rescue" },
            user: { id: 42, name: "O&#8217;Brien", email: "o@acme.test" },
          },
        ],
        total: 1,
      }),
    );

    const result = await businessDashboardService.getCertificates();

    expect(result.items[0].course_name).toBe("Fire & Rescue");
    expect(result.items[0].learner_name).toBe("O’Brien");
  });
});

describe("collapsing wire list keys", () => {
  it("reads course learners from `learners` when `items` is absent", async () => {
    fetchMock.mockReturnValueOnce(
      res({ learners: [{ id: 1, user_id: 1, display_name: "Jane", email: "j@acme.test" }] }),
    );

    const result = await businessDashboardService.getCourseLearners(900);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].display_name).toBe("Jane");
  });

  it("reads course learners from `members` when neither `items` nor `learners` is present", async () => {
    fetchMock.mockReturnValueOnce(
      res({ members: [{ id: 2, user_id: 2, display_name: "Sam", email: "s@acme.test" }] }),
    );

    const result = await businessDashboardService.getCourseLearners(900);

    expect(result.items[0].id).toBe(2);
  });

  it("promotes `user_email` to `email` so components never have to alias", async () => {
    fetchMock.mockReturnValueOnce(
      res({ items: [{ id: 3, user_id: 3, display_name: "Ada", user_email: "ada@acme.test" }] }),
    );

    const result = await businessDashboardService.getCourseLearners(900);

    expect(result.items[0].email).toBe("ada@acme.test");
  });

  it("fills `id` from `user_id` when the row only carries one of them", async () => {
    fetchMock.mockReturnValueOnce(res({ items: [{ user_id: 7, display_name: "Kim" }] }));

    const result = await businessDashboardService.getCourseLearners(900);

    expect(result.items[0].id).toBe(7);
    expect(result.items[0].user_id).toBe(7);
  });

  it("reads the assignment list from `courses` on older builds", async () => {
    fetchMock.mockReturnValueOnce(res({ courses: [{ course_id: 5, course_name: "Fire" }] }));

    const result = await businessDashboardService.getAssignmentList();

    expect(result.items[0].course_id).toBe(5);
  });

  it("reads managers from `items` and settles on `user_email`", async () => {
    fetchMock.mockReturnValueOnce(
      res({ items: [{ id: 1, user_id: 1, display_name: "Lee", email: "lee@acme.test" }] }),
    );

    const result = await businessDashboardService.getManagers(12);

    expect(result.managers[0].user_email).toBe("lee@acme.test");
  });

  it("returns an empty list rather than undefined when the response carries no key at all", async () => {
    fetchMock.mockReturnValueOnce(res({ total: 0 }));

    const result = await businessDashboardService.getCourseLearners(900);

    expect(result.items).toEqual([]);
  });
});

describe("filter plumbing", () => {
  it("sends department_id on the team stats KPI", async () => {
    fetchMock.mockReturnValueOnce(res({ total: 0 }));

    await businessDashboardService.getTeamStats({ department_id: 3 });

    expect(calledPath()).toContain("department_id=3");
  });

  it("omits department_id entirely when unset, rather than sending 0", async () => {
    fetchMock.mockReturnValueOnce(res({ total: 0 }));

    await businessDashboardService.getTeamStats();

    expect(calledPath()).toBe("/api/business/team/stats");
  });

  it("sends department_id when listing learners available to assign", async () => {
    fetchMock.mockReturnValueOnce(res({ items: [], total: 0 }));

    await businessDashboardService.getAvailableLearners(900, { department_id: 4 });

    expect(calledPath()).toContain("department_id=4");
  });

  it("sends the date range on the certificate report", async () => {
    fetchMock.mockReturnValueOnce(res({ items: [], total: 0, pages: 0 }));

    await businessDashboardService.getReportCertificates({
      date_from: "2026-01-01",
      date_to: "2026-06-30",
    });

    const path = calledPath();
    expect(path).toContain("date_from=2026-01-01");
    expect(path).toContain("date_to=2026-06-30");
  });

  it("forwards a department filter on the reminder sweep", async () => {
    fetchMock.mockReturnValueOnce(res({ sent: 0, failed: 0, learners: 0, courses: 0 }));

    await businessDashboardService.remindBehind({ department_id: 3 });

    const body = fetchMock.mock.calls[0][1].body as string;
    expect(JSON.parse(body)).toEqual({ department_id: 3 });
  });
});
