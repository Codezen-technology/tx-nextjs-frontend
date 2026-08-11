"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import Link from "next/link";
import { Linkedin } from "lucide-react";
import type { CourseExpert } from "@/types/course";

interface CourseExpertsProps {
  experts: CourseExpert[];
}

function ExpertCard({ expert }: { expert: CourseExpert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-neutral-30 rounded-xl border bg-white p-6 shadow-xs">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-neutral-100">
          {isRenderableImageSrc(expert.image?.full) ? (
            <SafeImage
              src={expert.image!.full}
              alt={expert.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-neutral-900">{expert.title}</h3>
          {expert.designation ? (
            <p className="mt-0.5 text-sm text-neutral-500">{expert.designation}</p>
          ) : null}
          {expert.social_url ? (
            <Link
              href={expert.social_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn Profile
            </Link>
          ) : null}
        </div>
      </div>
      {expert.bio ? (
        <div className="mt-4">
          <div
            className={`prose prose-sm prose-neutral max-w-none overflow-hidden text-neutral-600 transition-all duration-300 ${expanded ? "" : "line-clamp-3"}`}
            dangerouslySetInnerHTML={{ __html: expert.bio }}
          />
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-secondary-500 mt-2 text-sm font-medium hover:underline"
          >
            {expanded ? "Show less" : "Show bio"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function CourseExperts({ experts }: CourseExpertsProps) {
  if (!experts.length) return null;

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900">
          Empower and Engage
        </h2>
        <p className="font-open-sans mt-4 text-base leading-normal text-neutral-600">
          Our expert Learning Designers craft every course to provide your learners with the most
          engaging and impactful training experience.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {experts.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} />
        ))}
      </div>
    </section>
  );
}
