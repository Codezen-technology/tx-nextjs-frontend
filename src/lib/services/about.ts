import { serverApi } from "@/lib/api/server";
import type { AboutPageData } from "@/types/about";

/**
 * Figma-derived defaults (node 649:22654), mirrored byte-for-byte from
 * `About_Fields`'s ACF `default_value`s. Used when the `/about/page` fetch
 * fails, so a backend outage is visually indistinguishable from a fresh,
 * unedited install.
 */
export const ABOUT_PAGE_DEFAULTS: AboutPageData = {
  hero: {
    eyebrow: "About us",
    heading: "Empowering Careers, Ensuring Compliance.",
    subheading:
      "Expert-led training to enhance skills, ensure compliance, and support career growth",
    primary_button: { label: "Get started", href: "/all-courses" },
    secondary_button: { label: "Chat to sales", href: "/contact-us" },
  },
  commitment_section: {
    heading: "Our Commitment to Excellence",
    subheading:
      "At Training Excellence, we are committed to delivering flexible, accessible, and industry-recognised courses that enhance skills, ensure compliance, and drive career growth.",
    blocks: [
      {
        icon: "message-chat",
        heading: "What We Offer?",
        text: "Whether you're an individual or an organisation leader, we welcome all to learn, grow, and achieve excellence.",
        check_items: [
          "Compliance & Professional Development Training",
          "100% Online Training with Maximum Flexibility",
          "Instant CPD-Accredited Digital Certificates",
          "Corporate & Bulk Enrolment Discounts",
          "24/7 support and 14-day money-back guarantee",
        ],
        image: null,
      },
      {
        icon: "zap",
        heading: "Why Train with Us?",
        text: "We are dedicated to delivering a top-quality, flexible learning experience tailored to your needs.",
        check_items: [
          "Expert-Led & Industry-Aligned",
          "Flexible Corporate Training Solutions",
          "Engaging, Case-Based Learning",
          "Zero Risk with 24/7 support and 14-day moneyback guarantee",
        ],
        image: null,
      },
      {
        icon: "chart-breakout",
        heading: "Train Your Workforce with Confidence",
        text: "A well-trained team means better compliance, higher productivity, and fewer risks.",
        check_items: [
          "Stay compliant, enhance skills, and boost productivity",
          "Seamless navigation, flexible, and hassle-free training",
          "Affordable training with instant accredited certificates",
          "Expert-led courses for fast, impactful results",
        ],
        image: null,
      },
    ],
  },
  values: {
    eyebrow: "Our values",
    heading:
      "We value excellence, flexibility, and integrity, empowering growth through quality training.",
    cards: [
      {
        icon: "message-chat",
        title: "Commitment to Learning",
        description:
          "We empower individuals and businesses with knowledge that drives real-world success.",
      },
      {
        icon: "zap",
        title: "Innovation",
        description: "We continuously improve our training to meet evolving industry standards.",
      },
      {
        icon: "chart-breakout",
        title: "Excellence",
        description:
          "We deliver high-quality, industry-recognised training to ensure professional growth and compliance.",
      },
      {
        icon: "message-smile",
        title: "Flexibility",
        description:
          "Learning should fit your schedule, so our courses are 100% online and accessible anytime, anywhere.",
      },
      {
        icon: "command",
        title: "Learner-Centric",
        description:
          "We prioritise your learning experience with dedicated support and a seamless platform.",
      },
      {
        icon: "message-heart",
        title: "Impact-Driven",
        description:
          "Our training is designed to create real-world value, enhancing skills and career growth.",
      },
    ],
  },
  team: {
    eyebrow: "Join our team",
    heading: "We're just getting started",
    text: "Our philosophy is simple — hire a team of diverse, passionate people and foster a culture that empowers you to do your best work.",
    primary_button: { label: "We're hiring!", href: "/contact-us?enquiry=careers" },
    secondary_button: { label: "Read our principles", href: "/about-us#values" },
    photos: [null, null, null, null, null],
  },
};

/** Fetch `/about/page`, falling back to the Figma-derived defaults on any error. */
export async function getAboutPage(): Promise<AboutPageData> {
  return serverApi.about.get().catch(() => ABOUT_PAGE_DEFAULTS);
}
