/** Server-only fetcher for the Contact Us page content (ACF + GF form). */
import { serverFetch } from "@/lib/api/server";
import { env } from "@/lib/env";
import type { ContactPageContent } from "@/types/contact";

const lms = `/${env.LMS_NAMESPACE}`;

/** Design defaults — used when ACF fields are empty / the endpoint is down. */
export const CONTACT_FALLBACK: ContactPageContent = {
  hero: {
    eyebrow: "Contact us",
    heading: "Get in Touch with Us",
    text: "Have questions about our courses, corporate training solutions, or enrolment process? We're here to help! Contact us anytime, and our team will assist you promptly.",
  },
  cards: [
    {
      icon: "email",
      title: "Email",
      description: "Our friendly team is here to help.",
      value: "hi@trainingexcellence.org.uk",
      href: "mailto:hi@trainingexcellence.org.uk",
    },
    {
      icon: "office",
      title: "Office",
      description: "Come say hello at our office HQ.",
      value: "Riverside Business Park, Danson Way, Ilkley, West Yorkshire, LS29 8JZ",
      href: "",
    },
    {
      icon: "phone",
      title: "Phone",
      description: "Mon-Fri from 8am to 5pm.",
      value: "+44 (0)1943 605050",
      href: "tel:+441943605050",
    },
  ],
  form: {
    eyebrow: "Contact us",
    heading: "Get in touch",
    text: "We'd love to hear from you. Please fill out this form.",
    formId: null,
  },
};

/** Fetch the contact page, falling back per-field so the design never renders blank. */
export async function fetchContactPage(): Promise<ContactPageContent> {
  let data: ContactPageContent | null = null;
  try {
    data = await serverFetch<ContactPageContent>(`${lms}/contact/page`, {
      revalidate: 3600,
      tags: ["contact-page"],
    });
  } catch {
    return CONTACT_FALLBACK;
  }

  return {
    hero: {
      eyebrow: data.hero?.eyebrow || CONTACT_FALLBACK.hero.eyebrow,
      heading: data.hero?.heading || CONTACT_FALLBACK.hero.heading,
      text: data.hero?.text || CONTACT_FALLBACK.hero.text,
    },
    cards: data.cards?.length ? data.cards : CONTACT_FALLBACK.cards,
    form: {
      eyebrow: data.form?.eyebrow || CONTACT_FALLBACK.form.eyebrow,
      heading: data.form?.heading || CONTACT_FALLBACK.form.heading,
      text: data.form?.text || CONTACT_FALLBACK.form.text,
      formId: data.form?.formId ?? null,
    },
  };
}
