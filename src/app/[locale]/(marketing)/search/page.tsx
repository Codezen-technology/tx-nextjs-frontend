import type { Metadata } from "next";
import { serverApi } from "@/lib/api/server";
import { normalizeCourse } from "@/lib/services/courses";
import { fetchBlogPage } from "@/lib/services/blog.server";
import { CourseCard } from "@/components/courses/course-card";
import { BlogCard } from "@/components/home/blog-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ApiCourse } from "@/lib/api/server";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: { q?: string };
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const q = searchParams.q?.trim() ?? "";
  return {
    title: q ? `Search results for "${q}" | Training Excellence` : "Search | Training Excellence",
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const q = searchParams.q?.trim() ?? "";

  const [coursesResult, blogResult] = await Promise.allSettled([
    q.length >= 2 ? serverApi.courses.list({ search: q, per_page: 12 }) : Promise.resolve(null),
    q.length >= 2 ? fetchBlogPage(1, 6) : Promise.resolve(null),
  ]);

  const rawCourses =
    coursesResult.status === "fulfilled" && coursesResult.value
      ? (coursesResult.value?.items ?? [])
      : [];

  const courses = rawCourses.map((raw) =>
    normalizeCourse(raw as Parameters<typeof normalizeCourse>[0]),
  );

  const blogPosts =
    blogResult.status === "fulfilled" && blogResult.value
      ? blogResult.value.posts.filter((p) => {
          if (!q) return true;
          const lq = q.toLowerCase();
          return (
            p.title.rendered.toLowerCase().includes(lq) ||
            p.excerpt.rendered.toLowerCase().includes(lq)
          );
        })
      : [];

  const totalResults = courses.length + blogPosts.length;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#00204a] py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="container relative">
          {q ? (
            <>
              <p className="font-open-sans text-sm text-white/60">Search results</p>
              <h1 className="mt-1 font-suse text-3xl font-bold text-white md:text-4xl">
                &ldquo;{q}&rdquo;
              </h1>
              {totalResults > 0 && (
                <p className="mt-2 font-open-sans text-sm text-white/70">
                  {totalResults} result{totalResults !== 1 ? "s" : ""} found
                </p>
              )}
            </>
          ) : (
            <h1 className="font-suse text-3xl font-bold text-white">Search</h1>
          )}

          {/* Inline search bar */}
          <form
            method="get"
            action="/search"
            className="mt-6 flex max-w-lg overflow-hidden rounded-lg shadow-lg"
          >
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search courses, topics..."
              autoFocus
              className="flex-1 bg-white px-4 py-3 font-open-sans text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-secondary-500 px-6 py-3 font-open-sans text-sm font-semibold text-white transition-colors hover:bg-secondary-600"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="py-12">
        <div className="container space-y-14">
          {!q && (
            <EmptyState
              title="Start searching"
              description="Enter a keyword above to find courses and articles."
            />
          )}

          {q && totalResults === 0 && (
            <EmptyState
              title={`No results for "${q}"`}
              description="Try different keywords or browse our course catalogue."
            />
          )}

          {/* Courses */}
          {courses.length > 0 && (
            <section>
              <div className="mb-6 flex items-end justify-between">
                <h2 className="font-suse text-2xl font-bold text-[#00204a]">
                  Courses
                  <span className="ml-2 font-open-sans text-base font-normal text-neutral-400">
                    ({courses.length})
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}

          {/* Blog */}
          {blogPosts.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="font-suse text-2xl font-bold text-[#00204a]">
                  Articles
                  <span className="ml-2 font-open-sans text-base font-normal text-neutral-400">
                    ({blogPosts.length})
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {blogPosts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
