import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Award,
  Lightbulb,
  Medal,
  Blend,
  GraduationCap,
  HeartHandshake,
} from "lucide-react";
import { getLocale, setRequestLocale } from "next-intl/server";
import { fetchRankMathSeo, buildPageMetadata, stringifyJsonLd } from "@/lib/seo/server";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";

export const revalidate = 3600;

const OFFER_POINTS = [
  "Compliance & technical development training",
  "CPD, UKRLP & RoSPA-accredited online courses",
  "Same-day certificates upon completion",
  "Corporate & team enrolment options",
  "Courses across health & safety, food hygiene, safeguarding and more",
];

const TRAIN_POINTS = [
  "Learn online at your own pace, on any device",
  "Instant digital certificates the same day",
  "24/7 access to course content and tutor support",
  "Keep your team compliant with simple group training",
];

const WORKFORCE_POINTS = [
  "Flexible training built around your team's schedule",
  "Track progress and completion across your workforce",
  "Volume pricing for businesses of all sizes",
];

const VALUES = [
  {
    icon: GraduationCap,
    title: "Commitment to Learning",
    description:
      "We empower individuals and businesses with knowledge that drives real career growth.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description:
      "We continuously improve our courses and platform to make online learning simple and engaging.",
  },
  {
    icon: Award,
    title: "Excellence",
    description:
      "Every course is built to the highest standard, fully accredited by trusted industry bodies.",
  },
  {
    icon: Blend,
    title: "Flexibility",
    description: "Learning that fits around your life — study anytime, anywhere, on any device.",
  },
  {
    icon: Medal,
    title: "Learner Success",
    description:
      "We measure our success by yours: real skills, recognised certificates, better careers.",
  },
  {
    icon: HeartHandshake,
    title: "Impact-Driven",
    description: "We help workplaces become safer and more compliant, one learner at a time.",
  },
];

const ABOUT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Training Excellence",
  description:
    "Training Excellence delivers fully accredited, 100% online compliance training trusted by learners and leading organisations across the UK.",
};

export async function generateMetadata(): Promise<Metadata> {
  setRequestLocale(await getLocale());
  const seo = await fetchRankMathSeo("/about");
  return buildPageMetadata(seo, {
    title: "About Us | Training Excellence",
    description:
      "Training Excellence delivers fully accredited, 100% online compliance training trusted by learners and leading organisations across the UK.",
    canonical: `${env.SITE_URL.replace(/\/$/, "")}/about`,
  });
}

function CheckList({ points }: { points: string[] }) {
  return (
    <ul className="mt-6 space-y-3">
      {points.map((point) => (
        <li key={point} className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary-500" />
          <span className="font-open-sans text-sm text-neutral-600">{point}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionImage({ label }: { label: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex aspect-[4/3] w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100"
    >
      <span className="px-6 text-center font-suse text-lg font-bold text-primary-300">{label}</span>
    </div>
  );
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(ABOUT_SCHEMA) }}
      />

      <section className="bg-primary-50 py-16 text-center">
        <div className="container">
          <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-secondary-500">
            About us
          </p>
          <h1 className="mt-2 font-suse text-4xl font-bold text-neutral-900 sm:text-5xl">
            Empowering Careers, Ensuring Compliance.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-open-sans text-neutral-500">
            Expert-led training to enhance skills, ensure compliance, and support career growth.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild className="bg-secondary-500 text-white hover:bg-secondary-600">
              <Link href="/all-courses">Find a course</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/contact">Contact us</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="container max-w-3xl">
          <h2 className="font-suse text-3xl font-bold text-neutral-900">
            Our Commitment to Excellence
          </h2>
          <p className="mt-4 font-open-sans text-neutral-500">
            At Training Excellence, we are committed to delivering flexible, accessible, and fully
            accredited online training that helps individuals upskill, stay compliant, and grow
            their careers — and helps businesses keep their teams safe and certified.
          </p>
        </div>
      </section>

      <section className="py-10">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-suse text-2xl font-bold text-neutral-900">What We Offer?</h2>
            <p className="mt-3 font-open-sans text-sm text-neutral-500">
              Whether you&apos;re an individual or an organisation, our course library covers the
              compliance and professional skills you need.
            </p>
            <CheckList points={OFFER_POINTS} />
          </div>
          <SectionImage label="Learning that works for you" />
        </div>
      </section>

      <section className="py-10">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <SectionImage label="Train anywhere, anytime" />
          <div>
            <h2 className="font-suse text-2xl font-bold text-neutral-900">Why Train with Us?</h2>
            <p className="mt-3 font-open-sans text-sm text-neutral-500">
              We are dedicated to removing every barrier between you and your next certificate.
            </p>
            <CheckList points={TRAIN_POINTS} />
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-suse text-2xl font-bold text-neutral-900">
              Train Your Workforce with Confidence
            </h2>
            <p className="mt-3 font-open-sans text-sm text-neutral-500">
              A team-based approach makes workplace compliance simpler, smarter, and easier to
              manage — for businesses of any size.
            </p>
            <CheckList points={WORKFORCE_POINTS} />
            <Button asChild className="mt-8 bg-secondary-500 text-white hover:bg-secondary-600">
              <Link href="/contact?enquiry=teams">Talk to our team</Link>
            </Button>
          </div>
          <SectionImage label="Built for teams" />
        </div>
      </section>

      <section className="mt-10 bg-primary-50 py-16">
        <div className="container">
          <h2 className="mx-auto max-w-2xl text-center font-suse text-2xl font-bold text-neutral-900">
            We value excellence, flexibility, and integrity, empowering growth through quality
            training.
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-secondary-500 shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-suse text-lg font-bold text-neutral-900">{title}</h3>
                <p className="mt-2 font-open-sans text-sm text-neutral-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container text-center">
          <p className="font-open-sans text-sm font-semibold uppercase tracking-wide text-secondary-500">
            Our journey
          </p>
          <h2 className="mt-2 font-suse text-3xl font-bold text-neutral-900">
            We&apos;re just getting started
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-open-sans text-neutral-500">
            Our platform is trusted by learners and growing businesses across the UK — and we keep
            adding new accredited courses every month.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { value: "3M+", label: "Learners trained" },
              { value: "100%", label: "Online courses" },
              { value: "24/7", label: "Tutor support" },
              { value: "14-day", label: "Money-back guarantee" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="font-suse text-3xl font-bold text-secondary-500">{value}</p>
                <p className="mt-1 font-open-sans text-sm text-neutral-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
