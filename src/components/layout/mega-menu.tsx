"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Utensils,
  ShieldCheck,
  Baby,
  FlaskConical,
  GraduationCap,
  Flame,
  Brain,
  Heart,
  Briefcase,
  MoveRight,
  CheckCircle,
} from "lucide-react";
import type { CourseCategory } from "@/types/course";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "food-hygiene": Utensils,
  "health-and-safety": ShieldCheck,
  "health-safety": ShieldCheck,
  safeguarding: Baby,
  haccp: FlaskConical,
  education: GraduationCap,
  teaching: GraduationCap,
  "fire-safety": Flame,
  "mental-health": Brain,
  "health-and-social-care": Heart,
  "health-social-care": Heart,
  "business-essentials": Briefcase,
  business: Briefcase,
};

function getCategoryIcon(slug: string): React.ComponentType<{ className?: string }> {
  const key = Object.keys(CATEGORY_ICONS).find(
    (k) => slug === k || slug.includes(k) || k.includes(slug.split("-")[0]),
  );
  return key ? CATEGORY_ICONS[key] : GraduationCap;
}

const BUSINESS_FEATURES = [
  "All Premium features included",
  "Central training dashboard",
  "Dedicated Manager for your team",
  "Real-time progress tracking",
  "Streamlined enrolment and management",
];

interface MegaMenuProps {
  onClose: () => void;
  categories: CourseCategory[];
}

function CategoryCard({ category }: { category: CourseCategory }) {
  const Icon = getCategoryIcon(category.slug);
  const isHighlighted = category.slug === "business-essentials";

  return (
    <Link
      href={`/course-cat/${category.slug}`}
      className={[
        "group flex items-center gap-4 rounded-lg border p-4 transition-all",
        isHighlighted
          ? "border-secondary-500 bg-secondary-50 hover:border-secondary-600 hover:bg-secondary-100"
          : "border-neutral-40 bg-white hover:border-neutral-60 hover:bg-neutral-20",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded",
          isHighlighted ? "bg-secondary-500" : "bg-neutral-30",
        ].join(" ")}
      >
        <Icon
          className={["h-5 w-5", isHighlighted ? "text-white" : "text-neutral-500"].join(" ")}
        />
      </div>
      <span
        className={[
          "flex-1 font-open-sans text-base font-bold leading-[1.5]",
          isHighlighted ? "text-secondary-500" : "text-neutral-500",
        ].join(" ")}
      >
        {category.name}
      </span>
      <MoveRight
        className={[
          "h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5",
          isHighlighted ? "text-secondary-500" : "text-neutral-300",
        ].join(" ")}
      />
    </Link>
  );
}

export function MegaMenu({ onClose, categories }: MegaMenuProps) {
  const displayed = categories.slice(0, 9);

  const rows: CourseCategory[][] = [];
  for (let i = 0; i < displayed.length; i += 3) {
    rows.push(displayed.slice(i, i + 3));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="absolute left-0 right-0 top-full z-50 bg-neutral-10 shadow-[0_16px_24px_rgba(0,0,0,0.17)]"
      role="dialog"
      aria-label="Our courses menu"
    >
      <div className="mx-auto flex max-w-[1400px] gap-6 px-6 py-14 lg:px-10">
        {/* Left: Business Training promo */}
        <div
          className="flex w-[280px] shrink-0 flex-col items-start justify-between rounded-2xl p-6"
          style={{ background: "linear-gradient(40deg, #00204a 9%, #1c395e 92%)" }}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h3 className="font-suse text-xl font-bold leading-[1.2] text-primary-500">
                Business Training
              </h3>
              <p className="font-open-sans text-base font-normal leading-[1.5] text-white">
                Transform Your Team&apos;s Potential
              </p>
            </div>
            <ul className="flex flex-col gap-4">
              {BUSINESS_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary-400" />
                  <span className="font-open-sans text-base font-normal leading-[1.5] text-white">
                    {feat}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/training-teams"
            className="mt-6 flex h-10 w-full items-center justify-center rounded-full border border-primary-500 bg-gradient-to-r from-primary-500 to-primary-200 px-4 font-open-sans text-base font-semibold text-neutral-900 shadow-sm transition-opacity hover:opacity-90"
          >
            Request for a Quote
          </Link>
        </div>

        {/* Right: Categories grid + banner */}
        <div className="flex flex-1 flex-col gap-8">
          {rows.length > 0 && (
            <div className="flex flex-col gap-6">
              {rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-3 gap-6">
                  {row.map((cat) => (
                    <CategoryCard key={cat.id} category={cat} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Explore all banner */}
          <div className="flex items-center justify-between rounded-2xl border border-neutral-40 bg-neutral-20 p-6">
            <div className="flex flex-col gap-2">
              <h4 className="font-suse text-xl font-bold leading-[1.2] text-neutral-500">
                Explore Our All Accredited Courses
              </h4>
              <p className="font-open-sans text-base font-normal leading-[1.5] text-neutral-300">
                Our fully accredited online courses are widely trusted by leading organisations
                across the UK and are ideal for training you and your team.
              </p>
            </div>
            <Link
              href="/all-courses"
              className="ml-6 flex shrink-0 items-center justify-center rounded-full bg-secondary-500 px-6 py-4 font-open-sans text-base font-semibold text-white shadow-sm transition-colors hover:bg-secondary-600"
            >
              See All Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Backdrop — closes menu on outside click */}
      <div className="fixed inset-0 -z-10" aria-hidden="true" onClick={onClose} />
    </div>
  );
}
