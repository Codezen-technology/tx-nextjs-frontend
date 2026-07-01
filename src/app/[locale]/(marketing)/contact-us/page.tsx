import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { fetchContactPage } from "@/lib/services/contact.server";
import { GravityFormLoader } from "@/components/forms/gravity-form-loader";
import { ContactForm } from "@/components/contact/contact-form";
import type { ContactCard } from "@/types/contact";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/contact-us");
  return buildPageMetadata(seo, {
    title: "Contact Us | Training Excellence",
    description:
      "Have questions about our courses, corporate training solutions, or enrolment process? Contact Training Excellence — our team will assist you promptly.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/contact-us`,
  });
}

function CardIcon({ icon }: { icon: string }) {
  const cls = "h-5 w-5 text-[#00bbf0]";
  if (icon === "office") return <MapPin className={cls} />;
  if (icon === "phone") return <Phone className={cls} />;
  return <Mail className={cls} />;
}

export default async function ContactPage() {
  setRequestLocale(await getLocale());
  const content = await fetchContactPage();

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Training Excellence",
    description: content.hero.text,
    url: `${env.SITE_URL.replace(/\/$/, "")}/contact-us`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(contactSchema) }}
      />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="container max-w-3xl text-center">
          <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-[#00bbf0]">
            {content.hero.eyebrow}
          </p>
          <h1 className="mt-3 font-suse text-3xl font-bold text-neutral-900 md:text-4xl">
            {content.hero.heading}
          </h1>
          <p className="mt-4 font-open-sans text-neutral-600">{content.hero.text}</p>
        </div>
      </section>

      {/* ── Contact cards ─────────────────────────────────────────────── */}
      <section className="pb-6">
        <div className="container">
          <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3">
            {content.cards.map((card, i) => (
              <ContactInfoCard key={i} card={card} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="container max-w-xl">
          <div className="text-center">
            <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-[#00bbf0]">
              {content.form.eyebrow}
            </p>
            <h2 className="mt-3 font-suse text-2xl font-bold text-neutral-900 md:text-3xl">
              {content.form.heading}
            </h2>
            <p className="mt-3 font-open-sans text-neutral-600">{content.form.text}</p>
          </div>
          <div className="mt-8">
            {content.form.formId ? (
              <GravityFormLoader formId={content.form.formId} fallback={<ContactForm />} />
            ) : (
              <ContactForm />
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function ContactInfoCard({ card }: { card: ContactCard }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e6f7fe]">
        <CardIcon icon={card.icon} />
      </div>
      <h3 className="mt-4 font-suse text-base font-bold text-neutral-900">{card.title}</h3>
      {card.description ? (
        <p className="mt-1 font-open-sans text-sm text-neutral-500">{card.description}</p>
      ) : null}
      {card.value ? (
        card.href ? (
          <a
            href={card.href}
            className="mt-2 font-open-sans text-sm font-semibold text-secondary-500 hover:underline"
          >
            {card.value}
          </a>
        ) : (
          <p className="mt-2 font-open-sans text-sm font-semibold text-secondary-500">
            {card.value}
          </p>
        )
      ) : null}
    </div>
  );
}
