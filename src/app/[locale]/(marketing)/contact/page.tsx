import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { serverApi } from "@/lib/api/server";
import { ContactForm } from "@/components/contact/contact-form";

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/contact");
  return buildPageMetadata(seo, {
    title: "Contact Us | Training Excellence",
    description:
      "Have questions about our courses, corporate training solutions, or enrolment process? Contact Training Excellence — our team will assist you promptly.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/contact`,
  });
}

export const revalidate = 3600;

const FALLBACK_CONTACT = {
  email: "hi@trainingexcellence.org.uk",
  phone: "",
  address: "",
};

export default async function ContactPage() {
  const footer = await serverApi.footer.get().catch(() => null);
  const contact = {
    email: footer?.contact?.email ?? FALLBACK_CONTACT.email,
    phone: footer?.contact?.phone ?? FALLBACK_CONTACT.phone,
    address: footer?.contact?.address ?? FALLBACK_CONTACT.address,
  };

  const cards = [
    {
      icon: Mail,
      title: "Email",
      description: "Our friendly team is here to help.",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    {
      icon: MapPin,
      title: "Office",
      description: "Come say hello at our office HQ.",
      value: contact.address,
      href: undefined,
    },
    {
      icon: Phone,
      title: "Phone",
      description: "Mon-Fri from 8am to 5pm.",
      value: contact.phone,
      href: `tel:${contact.phone.replace(/[^+\d]/g, "")}`,
    },
  ];

  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Training Excellence",
    description:
      "Have questions about our courses or corporate training? Get in touch with our team.",
    url: `${env.SITE_URL.replace(/\/$/, "")}/contact`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <section className="py-16">
        <div className="container text-center">
          <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-secondary-500">
            Contact us
          </p>
          <h1 className="mt-2 font-suse text-4xl font-bold text-neutral-900">
            Get in Touch with Us
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-open-sans text-neutral-500">
            Have questions about our courses, corporate training solutions, or enrolment process?
            We&apos;re here to help! Contact us anytime, and our team will assist you promptly.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {cards.map(({ icon: Icon, title, description, value, href }) => (
              <div key={title} className="flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-secondary-500">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 font-suse text-lg font-bold text-neutral-900">{title}</h2>
                <p className="mt-1 font-open-sans text-sm text-neutral-500">{description}</p>
                {href ? (
                  <a
                    href={href}
                    className="mt-3 font-open-sans text-sm font-semibold text-secondary-500 hover:text-secondary-600"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="mt-3 font-open-sans text-sm font-semibold text-secondary-500">
                    {value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-xl">
          <div className="text-center">
            <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-secondary-500">
              Contact us
            </p>
            <h2 className="mt-2 font-suse text-3xl font-bold text-neutral-900">Get in touch</h2>
            <p className="mt-3 font-open-sans text-neutral-500">
              We&apos;d love to hear from you. Please fill out this form.
            </p>
          </div>
          <div className="mt-10">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
