import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CourseRichData } from "@/types/course";

interface CourseBreadcrumbProps {
  course: CourseRichData;
}

export function CourseBreadcrumb({ course }: CourseBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="border-neutral-30 font-open-sans border-b bg-white py-2.5 text-sm text-neutral-500"
    >
      <ol className="container flex max-w-[1296px] flex-wrap items-center gap-1.5 px-4">
        <li>
          <Link href="/" className="hover:text-primary-600 transition-colors">
            Home
          </Link>
        </li>
        <li className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
          <Link href="/all-courses" className="hover:text-primary-600 transition-colors">
            Courses
          </Link>
        </li>
        {course.breadcrumb?.map((crumb) => (
          <li key={crumb.id} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
            <Link
              href={`/course-cat/${crumb.slug}`}
              className="hover:text-primary-600 transition-colors"
            >
              {crumb.name}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" aria-hidden />
          <span className="line-clamp-1 font-medium text-neutral-900">{course.title}</span>
        </li>
      </ol>
    </nav>
  );
}
