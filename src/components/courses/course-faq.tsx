"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Minus, Plus } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

interface CourseFaqProps {
  heading?: string | null;
  items: FaqItem[];
}

/**
 * The site's FAQ accordion — `QA-BLOGS-A7` and `QA-HELP-A1`, one defect on two
 * pages.
 *
 * Every value here is measured, not chosen: the single-blog frame
 * (`6015:127392`) and the help frame (`6239:109818`) specify the *identical*
 * treatment, which is what established this as the site-wide FAQ design rather
 * than one page's. The comparison table is in `.context/figma/targets.md`.
 *
 * Built on `@radix-ui/react-accordion` directly rather than on the shadcn
 * `Accordion` wrapper: the wrapper hardcodes a `ChevronDown` and the frames use
 * `+` / `−`, and editing it would drag `my-orders` along. Going through the
 * primitive also keeps the roving focus, arrow-key navigation and
 * `aria-controls` / `role="region"` wiring that the page-local accordion this
 * component replaced already had — converging on the old plain-button markup
 * would have been an accessibility regression no visual check catches.
 *
 * Both frames show the first question expanded, hence `defaultValue`.
 * `collapsible` keeps the click-again-to-close behaviour the old component had.
 *
 * Hover is deliberate and is *not* from the frames, which carry no hover state:
 * it was shipped by `QA-COURSE-A4` and is preserved here so a restyle does not
 * silently reopen a closed row.
 */
export function CourseFaq({ heading, items }: CourseFaqProps) {
  if (!items.length) {
    return <p className="font-open-sans text-sm text-neutral-500">No FAQs available.</p>;
  }

  return (
    <div className="space-y-8">
      <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900">
        {heading ?? "Frequently Asked Questions"}
      </h2>

      {/* Container: secondary-50 at 50% alpha, square, unbordered. */}
      <AccordionPrimitive.Root
        type="single"
        collapsible
        defaultValue="faq-0"
        className="bg-secondary-50/50 overflow-hidden"
      >
        {items.map((faq, i) => (
          <AccordionPrimitive.Item
            key={i}
            value={`faq-${i}`}
            /* Row divider is N30, not the secondary tint the build used. */
            className="border-neutral-30 border-b last:border-b-0"
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger className="hover:bg-secondary-50 group flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-6 text-left transition-colors">
                {/* Question: Open Sans 400 / 16 / 1.5 in N500. */}
                <span className="font-open-sans text-[16px] leading-[1.5] font-normal text-neutral-500">
                  {faq.question}
                </span>
                {/* 24px toggle. Radix drives which glyph shows via data-state,
                    so both are rendered and one is hidden — a conditional would
                    need client state this component no longer keeps. */}
                <Plus
                  className="text-secondary-500 group-hover:text-secondary-600 h-6 w-6 shrink-0 transition-colors group-data-[state=open]:hidden"
                  aria-hidden
                />
                <Minus
                  className="text-secondary-500 group-hover:text-secondary-600 hidden h-6 w-6 shrink-0 transition-colors group-data-[state=open]:block"
                  aria-hidden
                />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>

            {/* Answer: outer 24 inset, inner panel solid secondary-50. */}
            <AccordionPrimitive.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
              <div className="px-6 pb-6">
                <div className="bg-secondary-50 px-6 py-6">
                  <div
                    className="prose prose-neutral font-open-sans max-w-none text-[14px] leading-[1.5] text-neutral-500"
                    dangerouslySetInnerHTML={{ __html: faq.answer }}
                  />
                </div>
              </div>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
}
