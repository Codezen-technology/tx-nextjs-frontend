"use client";

import { useState } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { isRenderableImageSrc } from "@/lib/utils/image";
import Link from "next/link";
import {
  Check,
  Star,
  Users,
  Share2,
  Facebook,
  Linkedin,
  Twitter,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { CourseRichData } from "@/types/course";

const FEATURES = [
  "100% Online Training",
  "Instant Digital Certificate",
  "Printed Certificate Shipped",
  "Full Audio Voiceover",
  "Unlimited Assessment Retakes",
  "Written in compliance with UK legislation and guidance",
  "City & Guilds Assured",
  "CPD Accredited & RoSPA Assured",
];

type PurchaseTab = "me" | "teams";

interface PurchaseCardProps {
  course: CourseRichData;
}

function PurchaseCard({ course }: PurchaseCardProps) {
  const [tab, setTab] = useState<PurchaseTab>("me");
  const { pricing } = course;

  const durationLabel = course.duration
    ? `${(course.duration as { value: number; unit: string }).value} ${(course.duration as { value: number; unit: string }).unit}`
    : null;

  return (
    <div className="rounded-xl border border-[#ebedf1] bg-white shadow-md">
      {/* Tabs */}
      <div className="flex border-b border-[#ebedf1]">
        {(["me", "teams"] as PurchaseTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-sm font-semibold transition-colors",
              tab === t
                ? "border-b-2 border-secondary-500 text-secondary-600"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {t === "me" ? "For Me" : "For Teams"}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-5">
        {tab === "me" ? (
          <>
            {pricing ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span
                    className="text-3xl font-bold text-neutral-900"
                    dangerouslySetInnerHTML={{ __html: pricing.price_html }}
                  />
                  {pricing.is_on_sale && pricing.regular_price > pricing.price ? (
                    <span className="text-sm text-neutral-400 line-through">
                      £{pricing.regular_price.toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-neutral-500">+VAT where applicable</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-neutral-600 mb-3">Contact us for pricing.</p>
              </div>
            )}

            {pricing ? (
              <Link
                href={`/checkout?course=${course.id}`}
                className="block w-full rounded-lg bg-secondary-500 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-secondary-600"
              >
                Buy Now
              </Link>
            ) : (
              <Link
                href="/contact"
                className="block w-full rounded-lg bg-secondary-500 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-secondary-600"
              >
                Get in Touch
              </Link>
            )}

            <p className="text-center text-xs text-neutral-500">14 Days Money-Back Guarantee</p>

            <div className="border-t border-[#ebedf1] pt-4 space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                This course includes:
              </p>
              {[
                durationLabel ? `${durationLabel} of content` : null,
                course.cpd_points ? `${course.cpd_points} CPD points` : null,
                "Lifetime access",
                "Unlimited free exam retakes",
              ]
                .filter(Boolean)
                .map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-neutral-700">
                    <Check className="h-4 w-4 shrink-0 text-secondary-500" />
                    {item}
                  </div>
                ))}
            </div>

            <div className="border-t border-[#ebedf1] pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Share this course:
              </p>
              <div className="flex gap-2">
                {[
                  { Icon: Facebook, label: "Facebook", color: "hover:bg-blue-600" },
                  { Icon: Linkedin, label: "LinkedIn", color: "hover:bg-blue-700" },
                  { Icon: Twitter, label: "Twitter", color: "hover:bg-sky-500" },
                ].map(({ Icon, label, color }) => (
                  <button
                    key={label}
                    aria-label={`Share on ${label}`}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:text-white",
                      color,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4 text-center py-4">
            <Share2 className="h-10 w-10 mx-auto text-neutral-300" />
            <h3 className="font-semibold text-neutral-900">Team Training</h3>
            <p className="text-sm text-neutral-600">
              Get volume discounts and centralised reporting for teams of 5 or more.
            </p>
            <Link
              href="/contact?enquiry=teams"
              className="block w-full rounded-lg bg-secondary-500 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-secondary-600"
            >
              Get a Team Quote
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface CourseInfoCardProps {
  course: CourseRichData;
}

export function CourseInfoCard({ course }: CourseInfoCardProps) {
  const hasAccreditations = (course.accreditations?.length ?? 0) > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
      {/* Left — accreditation logos */}
      {hasAccreditations ? (
        <div className="rounded-xl border border-[#ebedf1] bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
            Accredited By
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {course.accreditations!.map((acc) => (
              <div key={acc.slug} className="flex flex-col items-center gap-1.5 text-center">
                {isRenderableImageSrc(acc.logo) ? (
                  <div className="relative h-12 w-24">
                    <SafeImage
                      src={acc.logo}
                      alt={acc.label}
                      fill
                      sizes="96px"
                      className="object-contain"
                    />
                  </div>
                ) : null}
                <span className="text-xs text-neutral-600 leading-tight">{acc.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* Centre — details + features */}
      <div className="rounded-xl border border-[#ebedf1] bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-neutral-900">{course.title}</h2>
        {course.rating !== undefined ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {course.rating.toFixed(1)}
            </span>
            {course.ratingCount ? (
              <span className="text-neutral-400">
                ({course.ratingCount.toLocaleString()} ratings)
              </span>
            ) : null}
            {course.studentsCount ? (
              <span className="flex items-center gap-1 text-neutral-400">
                <Users className="h-3.5 w-3.5" />
                {course.studentsCount.toLocaleString()} students
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="space-y-2">
          {FEATURES.map((feat) => (
            <div key={feat} className="flex items-start gap-2.5 text-sm text-neutral-700">
              <Check className="h-4 w-4 shrink-0 mt-0.5 text-secondary-500" />
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Right — purchase card */}
      <PurchaseCard course={course} />
    </div>
  );
}
