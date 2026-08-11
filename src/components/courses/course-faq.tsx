"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

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
      <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900">
        {heading ?? "Frequently Asked Questions"}
      </h2>
      <div className="border-secondary-50 bg-secondary-50 overflow-hidden rounded-lg border">
        {items.map((faq, i) => (
          <div key={i} className="border-secondary-50 border-b last:border-b-0">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-6 py-6 text-left"
              aria-expanded={openIndex === i}
            >
              <span className="font-open-sans text-base font-medium text-neutral-900">
                {faq.question}
              </span>
              {openIndex === i ? (
                <Minus className="text-secondary-500 h-5 w-5 shrink-0" />
              ) : (
                <Plus className="text-secondary-500 h-5 w-5 shrink-0" />
              )}
            </button>
            {openIndex === i ? (
              <div className="border-secondary-50 bg-secondary-100 m-4 border-t px-6 py-6">
                <div
                  className="prose prose-neutral font-open-sans max-w-none text-sm leading-relaxed text-neutral-600"
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
