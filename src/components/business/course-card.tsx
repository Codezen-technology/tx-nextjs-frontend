"use client";

import { Award, BookOpen, Clock, Star, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AssignedCourse } from "@/types/business-dashboard";

const DAY_SECONDS = 86_400;
/**
 * Five years. WPLMS writes an absurd duration rather than null to mean
 * "never expires", so anything past this is treated as no expiry rather than
 * rendered as "1825 days access".
 */
const NO_EXPIRY_DAYS = 1825;

/** Human access period, or null when the course never expires. */
function accessPeriod(duration?: number): string | null {
  if (!duration || duration <= 0) return null;

  const days = Math.round(duration / DAY_SECONDS);
  if (days >= NO_EXPIRY_DAYS) return null;
  if (days < 1) return "Less than a day access";
  if (days === 1) return "1 day access";
  if (days < 60) return `${days} days access`;

  const months = Math.round(days / 30);
  if (months < 24) return `${months} month${months === 1 ? "" : "s"} access`;

  return `${Math.round(days / 365)} years access`;
}

function Chip({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span className="bg-neutral-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-neutral-700">
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

interface BusinessCourseCardProps {
  course: AssignedCourse;
  onAssign: (course: AssignedCourse) => void;
}

export function BusinessCourseCard({ course, onAssign }: BusinessCourseCardProps) {
  const rating = course.average_rating ?? 0;
  const ratingCount = course.rating_count ?? 0;
  const access = accessPeriod(course.duration);

  return (
    <article className="border-neutral-30 flex flex-col overflow-hidden rounded-xl border bg-white shadow-xs">
      {course.featured_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.featured_image} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="bg-neutral-10 flex h-36 w-full items-center justify-center">
          <BookOpen className="h-8 w-8 text-neutral-200" />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="min-w-0">
          <h3 className="line-clamp-2 font-semibold text-neutral-900">{course.name}</h3>
          {course.excerpt ? (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-300">{course.excerpt}</p>
          ) : null}
        </div>

        {ratingCount > 0 ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 fill-[#F9A31A] text-[#F9A31A]" />
            <span className="font-medium text-neutral-900">{rating.toFixed(1)}</span>
            <span className="text-xs text-neutral-300">({ratingCount})</span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {course.total_lessons != null ? (
            <Chip icon={BookOpen}>{course.total_lessons} lessons</Chip>
          ) : null}
          {access ? <Chip icon={Clock}>{access}</Chip> : null}
          {course.has_certificate ? <Chip icon={Award}>Certificate</Chip> : null}
        </div>

        <Button
          size="sm"
          className="mt-auto w-full bg-[#3F576F] hover:bg-[#33485d]"
          onClick={() => onAssign(course)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Assign
        </Button>
      </div>
    </article>
  );
}
