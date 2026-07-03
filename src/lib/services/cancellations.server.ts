/** Server-only fetcher for Cancellations & Refunds page content (ACF + GF form ids). */
import { serverFetch } from "@/lib/api/server";
import { env } from "@/lib/env";
import type { CancellationsPageContent } from "@/types/cancellations";

const lms = `/${env.LMS_NAMESPACE}`;

export const CANCELLATIONS_FALLBACK: CancellationsPageContent = {
  cancellations: {
    hero: {
      eyebrow: "Cancellations & Refunds",
      heading: "Cancellations & Refunds",
      text: "Start with the fastest route: tell us what went wrong, let us fix simple issues first, or continue to a refund request when that is the right next step.",
    },
    cta: {
      supportLabel: "Get quick help first",
      refundLabel: "Check refund options",
    },
    refundFormId: null,
  },
  supportRequest: {
    hero: {
      eyebrow: "Priority Support",
      heading: "We'll sort this out",
      text: "Choose the issue that matches your situation and we will ask only for the details needed to fix it. Most course access, billing, and technical issues are resolved the same working day.",
    },
    supportFormId: null,
  },
};

/** Fetch cancellations page content, falling back per-field so the design never renders blank. */
export async function fetchCancellationsPage(): Promise<CancellationsPageContent> {
  let data: CancellationsPageContent | null = null;

  try {
    data = await serverFetch<CancellationsPageContent>(`${lms}/cancellations/page`, {
      revalidate: 3600,
      tags: ["cancellations-page"],
    });
  } catch {
    return CANCELLATIONS_FALLBACK;
  }

  return {
    cancellations: {
      hero: {
        eyebrow:
          data.cancellations?.hero?.eyebrow || CANCELLATIONS_FALLBACK.cancellations.hero.eyebrow,
        heading:
          data.cancellations?.hero?.heading || CANCELLATIONS_FALLBACK.cancellations.hero.heading,
        text: data.cancellations?.hero?.text || CANCELLATIONS_FALLBACK.cancellations.hero.text,
      },
      cta: {
        supportLabel:
          data.cancellations?.cta?.supportLabel ||
          CANCELLATIONS_FALLBACK.cancellations.cta.supportLabel,
        refundLabel:
          data.cancellations?.cta?.refundLabel ||
          CANCELLATIONS_FALLBACK.cancellations.cta.refundLabel,
      },
      refundFormId: data.cancellations?.refundFormId ?? null,
    },
    supportRequest: {
      hero: {
        eyebrow:
          data.supportRequest?.hero?.eyebrow || CANCELLATIONS_FALLBACK.supportRequest.hero.eyebrow,
        heading:
          data.supportRequest?.hero?.heading || CANCELLATIONS_FALLBACK.supportRequest.hero.heading,
        text: data.supportRequest?.hero?.text || CANCELLATIONS_FALLBACK.supportRequest.hero.text,
      },
      supportFormId: data.supportRequest?.supportFormId ?? null,
    },
    notificationEmail: data.notificationEmail ?? null,
  };
}
