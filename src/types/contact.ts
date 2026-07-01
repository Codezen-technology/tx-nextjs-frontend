/** Contact Us page content (ACF) + selected Gravity Form — from /contact/page. */

export interface ContactCard {
  icon: "email" | "office" | "phone" | string;
  title: string;
  description: string;
  value: string;
  href: string;
}

export interface ContactPageContent {
  hero: { eyebrow: string; heading: string; text: string };
  cards: ContactCard[];
  form: {
    eyebrow: string;
    heading: string;
    text: string;
    /** GF form id chosen in ACF; null = use the built-in fallback form. */
    formId: number | null;
  };
}
