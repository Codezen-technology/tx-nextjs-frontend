import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/help");
  return buildPageMetadata(seo, {
    title: "Help & FAQs | Training Excellence",
    description:
      "Answers to the most common questions about Training Excellence courses, certificates, accreditation and corporate training.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/help`,
  });
}

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "How do I get a certificate?",
    answer:
      "Complete all units and pass the final assessment of your course. Your CPD-accredited certificate is generated instantly and can be downloaded from your dashboard or emailed to you the same day.",
  },
  {
    question: "Are your courses accredited?",
    answer:
      "Yes. Our courses are accredited by trusted bodies such as CPD, UKRLP, RoSPA and AOHT, and Training Excellence is a UKRLP-registered training provider.",
  },
  {
    question: "How long do I have access to a course?",
    answer:
      "Once enrolled, you have unlimited access to your course materials, so you can learn at your own pace and revisit content whenever you need a refresher.",
  },
  {
    question: "Can I train my whole team?",
    answer:
      "Absolutely. Our training-for-teams options make it simple to enrol, manage and track multiple learners. Contact us for corporate pricing and a tailored setup.",
  },
  {
    question: "What if I'm not satisfied with my course?",
    answer:
      "We offer a 14-day money-back guarantee. If the course isn't right for you, contact our support team within 14 days of purchase for a full refund.",
  },
  {
    question: "How quickly can I complete a course?",
    answer:
      "Our courses are fully online and self-paced. Many learners finish in a single sitting and receive their certificate the same day.",
  },
  {
    question: "How do I verify a certificate?",
    answer:
      "Use our free Certificate Validator. Enter the certificate code printed on the certificate to instantly confirm its authenticity.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <section className="bg-primary-50 py-16 text-center">
        <div className="container">
          <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-secondary-500">
            FAQs
          </p>
          <h1 className="mt-2 font-suse text-4xl font-bold text-neutral-900">
            We&apos;re here to help
          </h1>
          <p className="mx-auto mt-3 max-w-xl font-open-sans text-neutral-500">
            Have questions? We&apos;re here to help.
          </p>
          <Button asChild className="mt-6 bg-secondary-500 text-white hover:bg-secondary-600">
            <Link href="/contact">Get started</Link>
          </Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="mb-8 text-center font-suse text-2xl font-bold text-neutral-900">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.question}
                value={`faq-${i}`}
                className="rounded-lg border border-[#ebedf1] bg-white px-5"
              >
                <AccordionTrigger className="text-left font-open-sans font-semibold text-neutral-900 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-open-sans text-sm leading-relaxed text-neutral-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-3xl">
          <div className="rounded-xl border border-[#ebedf1] bg-primary-50 p-10 text-center">
            <h2 className="font-suse text-xl font-bold text-neutral-900">Still have questions?</h2>
            <p className="mt-2 font-open-sans text-sm text-neutral-500">
              Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly team.
            </p>
            <Button asChild className="mt-6 bg-secondary-500 text-white hover:bg-secondary-600">
              <Link href="/contact">Get in touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
