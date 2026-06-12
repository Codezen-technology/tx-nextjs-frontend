import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { serverApi } from "@/lib/api/server";
import { fetchSettings } from "@/lib/services/settings.server";
import { CertificateForm } from "./certificate-form";
import type { FooterNavLink, FooterData, WpNavItem } from "@/types/settings";
const overlayImage = "/images/bg-footer.webp";

function SocialIcon({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

const FacebookIcon = ({ className }: { className?: string }) => (
  <SocialIcon className={className}>
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </SocialIcon>
);

const XIcon = ({ className }: { className?: string }) => (
  <SocialIcon className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </SocialIcon>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <SocialIcon className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.02a8.16 8.16 0 004.77 1.52V7.1a4.85 4.85 0 01-1-.41z" />
  </SocialIcon>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <SocialIcon className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path
      d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" />
  </SocialIcon>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <SocialIcon className={className}>
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </SocialIcon>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <SocialIcon className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
  </SocialIcon>
);

const SOCIAL_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  facebook: FacebookIcon,
  twitter: XIcon,
  tiktok: TikTokIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
};

const SOCIAL_LABEL_MAP: Record<string, string> = {
  facebook: "Facebook",
  twitter: "X (Twitter)",
  tiktok: "TikTok",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

const FALLBACK_NAV_LINKS: FooterNavLink[] = [
  { href: "/about", label: "About us" },
  { href: "/careers", label: "Work for us" },
  { href: "/resources", label: "Resources", badge: "New" },
  { href: "/force-for-good", label: "Force for Good" },
  { href: "/reviews", label: "Reviews" },
  { href: "/help", label: "Help and FAQs" },
  { href: "/contact", label: "Contact us" },
  { href: "/verify-certificate", label: "Verify certificate" },
  { href: "/cancellations", label: "Cancellations and refunds" },
  { href: "/terms-and-conditions", label: "Policies and terms of use" },
];

type NavCol = { header?: string; links: FooterNavLink[] };

function buildNavColumns(nav: FooterData["nav"] | undefined): NavCol[] {
  if (!nav) {
    return [
      { header: "About", links: FALLBACK_NAV_LINKS.slice(0, 5) },
      { header: "Support", links: FALLBACK_NAV_LINKS.slice(5) },
    ];
  }
  if (Array.isArray(nav)) {
    const items = (nav as WpNavItem[]).map((item) => ({ label: item.title, href: item.url }));
    const mid = Math.ceil(items.length / 2);
    return [{ links: items.slice(0, mid) }, { links: items.slice(mid) }];
  }
  return [
    { header: "About", links: nav.about ?? [] },
    { header: "Support", links: nav.support ?? [] },
  ];
}

const FALLBACK_SOCIAL: FooterData["social"] = {
  facebook: "https://facebook.com/trainingexcellence",
  twitter: "https://x.com/trainingexcellence",
  tiktok: "https://tiktok.com/@trainingexcellence",
  instagram: "https://instagram.com/trainingexcellence",
  linkedin: "https://linkedin.com/company/trainingexcellence",
};

export async function SiteFooter() {
  const [footerData, settings] = await Promise.all([
    serverApi.footer.get().catch(() => null),
    fetchSettings().catch(() => null),
  ]);
  const navCols = buildNavColumns(footerData?.nav);
  const social = footerData?.social ?? FALLBACK_SOCIAL;
  const contact = footerData?.contact ?? {};

  const socialLinks = (Object.entries(social) as [string, string | null | undefined][])
    .filter((entry): entry is [string, string] => !!entry[1])
    .map(([platform, href]) => ({
      href,
      label: SOCIAL_LABEL_MAP[platform] ?? platform,
      Icon: SOCIAL_ICON_MAP[platform],
    }))
    .filter(
      (s): s is { href: string; label: string; Icon: ComponentType<{ className?: string }> } =>
        s.Icon !== undefined,
    );

  const logoUrl = settings?.logo_url ?? settings?.logo_dark_url;

  return (
    <footer
      className="relative bg-neutral-900 bg-cover bg-bottom"
      style={{ backgroundImage: `url(${overlayImage})` }}
    >
      <img
        src="/images/shape-bg-full.png"
        className="absolute inset-0 bg-top object-contain"
        alt="BG Shape"
      />
      {/* CTA band */}
      <div className="border-b border-neutral-500 px-4 py-16">
        <div className="mx-auto flex max-w-[768px] flex-col items-center gap-10 text-center">
          <div className="flex flex-col gap-4">
            <h2 className="font-suse text-[32px] font-medium leading-[1.2] text-white">
              Training That Works for Your Team
            </h2>
            <p className="font-open-sans text-[20px] font-light leading-[1.5] text-neutral-30">
              Our 100% online courses cover all your compliance and development needs, making
              training simple for teams of any size.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/contact"
              className="rounded-[4.8px] border border-secondary-500 bg-white px-6 py-4 font-open-sans text-[16px] leading-[1.5] text-secondary-500 transition-colors hover:bg-secondary-50"
            >
              Chat to us
            </Link>
            <Link
              href="/all-courses"
              className="rounded border border-secondary-500 bg-secondary-500 px-6 py-4 font-open-sans text-[16px] leading-[1.5] text-white transition-colors hover:bg-secondary-600"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="mx-auto max-w-[1296px] px-4 py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Logo + description + social */}
          <div className="flex flex-col gap-8 lg:w-[400px] lg:shrink-0 lg:pr-8">
            <Link href="/" aria-label="Training Excellence — home">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Training Excellence"
                  width={190}
                  height={80}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <span className="font-suse text-xl font-bold leading-tight text-white">
                  Training
                  <br />
                  <span className="text-primary-400">Excellence</span>
                </span>
              )}
            </Link>
            <p className="font-open-sans text-[16px] leading-[1.5] text-neutral-30">
              Training Excellence delivers CPD-accredited, expert-led online training for businesses
              and professionals. Our flexible, high-quality courses ensure compliance, workplace
              safety, and career growth—anytime, anywhere.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3.5">
                <span className="font-open-sans text-[14px] leading-[1.5] text-white">
                  Follow us:
                </span>
                <div className="flex items-center gap-4">
                  {socialLinks.map(({ href, label, Icon }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-30 transition-colors hover:text-primary-400"
                    >
                      <Icon className="h-6 w-6" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {(contact.email || contact.phone) && (
              <div className="flex flex-col gap-2">
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="font-open-sans text-[14px] leading-[1.5] text-neutral-30 transition-colors hover:text-primary-400"
                  >
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-open-sans text-[14px] leading-[1.5] text-neutral-30 transition-colors hover:text-primary-400"
                  >
                    {contact.email}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Links + Certificate validator */}
          <div className="flex flex-1 flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:pl-8">
            {/* Nav columns */}
            <div className="flex gap-8 lg:w-[320px] lg:shrink-0">
              {navCols.map((col, i) => (
                <div key={i} className="flex flex-1 flex-col gap-3">
                  {col.header && (
                    <p className="font-open-sans text-[12px] font-medium uppercase tracking-wide text-[#d0d5dd]">
                      {col.header}
                    </p>
                  )}
                  <ul className="flex flex-col gap-3">
                    {col.links.map(({ href, label, badge }) => (
                      <li key={href} className="flex items-center gap-2">
                        <a
                          href={href}
                          className="font-suse text-[16px] font-medium leading-[1.2] text-neutral-30 transition-colors hover:text-primary-400"
                        >
                          {label}
                        </a>
                        {badge && (
                          <span className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 font-open-sans text-[12px] font-medium leading-[18px] text-white">
                            {badge}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Certificate validator */}
            <div className="flex flex-col gap-4 lg:w-[360px] lg:shrink-0">
              <p className="font-open-sans text-[12px] leading-normal text-white">
                Certificate Validator
              </p>
              <p className="font-open-sans text-[16px] leading-[1.5] text-white">
                Quickly and easily check the validity of your Training Excellence course
                certificates with Training Excellence&apos;s Course Certificate Validator tool.
              </p>
              <CertificateForm />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-600 px-4">
        <div className="mx-auto max-w-[1296px] py-8 text-right">
          <p className="font-open-sans text-[16px] leading-[1.5] text-neutral-200">
            © {new Date().getFullYear()} Training Excellence.{" "}
            {contact.address ??
              "Riverside Business Park, Dansk Way, Ilkley, West Yorkshire, LS29 8JZ."}
            <br />
            VAT Reg. No: 923 6593 07 &nbsp;|&nbsp; Registered in England and Wales: 6428976
          </p>
          <p className="mt-1 font-open-sans text-[16px] leading-[1.5] text-neutral-200">
            This site is protected by reCAPTCHA and the Google{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary-500 underline underline-offset-2 hover:text-secondary-400"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary-500 underline underline-offset-2 hover:text-secondary-400"
            >
              Terms of Service
            </a>{" "}
            apply.
          </p>
        </div>
      </div>
    </footer>
  );
}
