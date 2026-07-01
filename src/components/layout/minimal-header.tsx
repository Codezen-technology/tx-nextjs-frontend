"use client";

import Image from "next/image";
import Link from "next/link";
import { useSiteSettings } from "@/components/providers/site-settings-provider";

/**
 * Distraction-free header — logo only. Used on focused flows (login, cart,
 * checkout) where the full nav would pull users away from the task.
 */
export function MinimalHeader() {
  const settings = useSiteSettings();
  const logoUrl = settings.logo_url ?? settings.logo_dark_url;

  return (
    <header className="w-full bg-neutral-800">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center px-4 py-5">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Training Excellence — home"
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Training Excellence"
              width={160}
              height={80}
              className="h-20 w-auto object-contain"
              priority
            />
          ) : (
            <span className="text-center font-suse text-xl font-bold leading-tight text-neutral-30">
              Training <span className="text-primary-400">Excellence</span>
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
