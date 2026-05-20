"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FaqItem {
  question: string;
  answer: string;
}

interface CourseFaqProps {
  heading?: string | null;
  items: FaqItem[];
}

export function CourseFaq({ heading, items }: CourseFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items.length) {
    return <p className="font-open-sans text-sm text-neutral-500">No FAQs available.</p>;
  }

  return (
    <div className="space-y-8">
      <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900 sm:text-[38px]">
        {heading ?? "Frequently Asked Questions"}
      </h2>
      <div className="overflow-hidden rounded-lg border border-neutral-30 bg-white">
        {items.map((faq, i) => (
          <div key={i} className="border-b border-neutral-30 last:border-b-0">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-6 text-left"
              aria-expanded={openIndex === i}
            >
              <span className="font-open-sans text-base font-medium text-neutral-900">
                {faq.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-neutral-500 transition-transform duration-200",
                  openIndex === i && "rotate-180",
                )}
              />
            </button>
            {openIndex === i ? (
              <div className="border-t border-neutral-30 bg-neutral-10 px-6 py-6">
                <div
                  className="prose prose-neutral max-w-none font-open-sans text-sm leading-relaxed text-neutral-700"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
