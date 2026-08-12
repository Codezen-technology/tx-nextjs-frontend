"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RefundRequestForm } from "@/components/cancellations/refund-request-form";
import { RefundSidebar } from "@/components/cancellations/refund-sidebar";
import { Button } from "@/components/ui/button";
import type { GravityForm as GravityFormSchema } from "@/types/form";

interface RefundFormSectionProps {
  form: GravityFormSchema | null;
  formId: number | null;
  supportEmail?: string | null;
  heading: string;
  intro: string;
}

export function RefundFormSection({
  form,
  formId,
  supportEmail,
  heading,
  intro,
}: RefundFormSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (searchParams.get("refund") === "1") {
      setRevealed(true);
    }
  }, [searchParams]);

  function revealForm() {
    setRevealed(true);
    router.replace("/cancellations?refund=1#refund-form", { scroll: false });
    requestAnimationFrame(() => {
      document
        .getElementById("refund-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section id="refund-form" className="py-section scroll-mt-28 bg-neutral-50/50 lg:py-16">
      <div className="container max-w-5xl">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            {revealed ? (
              <div className="border-neutral-30 animate-in fade-in rounded-2xl border bg-white p-6 shadow-xs duration-300 md:p-8">
                <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
                  {heading}
                </h2>
                <p className="font-open-sans mt-3 text-sm leading-relaxed text-neutral-600">
                  {intro}
                </p>

                <div className="mt-8">
                  <RefundRequestForm form={form} formId={formId} supportEmail={supportEmail} />
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
                  {heading}
                </h2>
                <p className="font-open-sans mt-3 text-sm leading-relaxed text-neutral-600">
                  {intro}
                </p>

                <div className="border-neutral-30 mt-8 rounded-2xl border bg-white p-8 shadow-xs md:p-10">
                  <p className="font-suse text-lg font-bold text-neutral-900">
                    Most issues are resolved faster through support
                  </p>
                  <p className="font-open-sans mt-2 text-sm leading-relaxed text-neutral-600">
                    Access problems, billing mistakes, and wrong-course purchases are often fixed
                    the same day without a refund review. If you still need a purchase checked
                    against the refund policy, continue below.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      onClick={revealForm}
                      className="bg-secondary-500 hover:bg-secondary-600 text-white"
                    >
                      Check refund options
                    </Button>
                    <Button asChild variant="outline" className="border-neutral-30 bg-white">
                      <Link href="/support-request">Get help first</Link>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <RefundSidebar className="lg:sticky lg:top-28 lg:self-start" />
        </div>
      </div>
    </section>
  );
}
