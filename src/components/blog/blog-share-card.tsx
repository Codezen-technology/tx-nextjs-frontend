"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Link2 } from "lucide-react";

interface BlogShareCardProps {
  url: string;
  title: string;
}

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

const LinkedinIcon = ({ className }: { className?: string }) => (
  <SocialIcon className={className}>
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </SocialIcon>
);

const WhatsappIcon = ({ className }: { className?: string }) => (
  <SocialIcon className={className}>
    <path d="M12 2a10 10 0 00-8.62 15.06L2 22l5.06-1.33A10 10 0 1012 2zm5.5 14.14c-.23.65-1.34 1.24-1.85 1.3-.47.06-1.06.09-1.71-.11a15.6 15.6 0 01-1.55-.57 12.3 12.3 0 01-4.7-4.15c-.68-.93-1.14-2.02-1.14-3.14 0-.94.5-1.8 1.1-2.4a.9.9 0 01.65-.3c.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.5.68 1.72.74 1.84.06.13.1.28.02.44a1.6 1.6 0 01-.26.4c-.12.14-.26.31-.37.42-.13.13-.26.27-.11.53.14.26.63 1.05 1.36 1.7.94.83 1.72 1.09 1.98 1.22.26.13.41.11.56-.06.16-.17.66-.76.83-1.02.17-.26.35-.22.58-.13.24.09 1.51.71 1.77.84.26.13.43.2.5.31.06.12.06.7-.16 1.4z" />
  </SocialIcon>
);

function buildShareUrl(
  platform: "facebook" | "linkedin" | "x" | "whatsapp",
  url: string,
  title: string,
): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "x":
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "whatsapp":
      return `https://wa.me/?text=${t}%20${u}`;
  }
}

const SOCIAL_BUTTONS = [
  { platform: "facebook" as const, label: "Share on Facebook", Icon: FacebookIcon },
  { platform: "linkedin" as const, label: "Share on LinkedIn", Icon: LinkedinIcon },
  { platform: "x" as const, label: "Share on X", Icon: XIcon },
  { platform: "whatsapp" as const, label: "Share on WhatsApp", Icon: WhatsappIcon },
];

export function BlogShareCard({ url, title }: BlogShareCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-primary-700 aspect-306/424 w-full rounded-lg" />

      <div className="border-neutral-30 flex flex-col gap-6 rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="font-suse text-xl leading-[1.2] font-bold text-neutral-900">
              Found this blog helpful?
            </p>
            <p className="font-open-sans text-base text-neutral-500">
              Share this guide with your team or across your social channels.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-primary-500 hover:bg-primary-600 flex w-full items-center justify-center gap-2 rounded px-3 py-2.5 shadow-xs transition-colors"
          >
            <Link2 className="h-5 w-5 text-white" />
            <span className="font-open-sans text-sm font-semibold text-white">
              {copied ? "Copied!" : "Copy link"}
            </span>
          </button>
        </div>

        <div className="bg-neutral-30 h-px w-full" />

        <div className="flex items-center gap-3">
          {SOCIAL_BUTTONS.map(({ platform, label, Icon }) => (
            <a
              key={platform}
              href={buildShareUrl(platform, url, title)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="border-neutral-40 hover:border-primary-500 hover:text-primary-500 flex h-10 flex-1 items-center justify-center rounded border bg-white text-neutral-500 shadow-xs transition-colors"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
