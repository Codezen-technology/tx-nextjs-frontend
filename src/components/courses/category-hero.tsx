import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { ApiCategory } from "@/lib/api/server";

interface CategoryHeroProps {
  category: ApiCategory;
}

export function CategoryHero({ category }: CategoryHeroProps) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 480 }}>
      {category.image ? (
        <Image src={category.image} alt={category.name} fill className="object-cover" priority />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(80.83deg, #00204a 0%, #004f65 100%)" }}
        />
      )}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="relative z-10 flex h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-[1296px] px-4">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 font-open-sans text-sm text-white/70">
            <Link href="/" className="flex items-center gap-1 hover:text-white">
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/all-courses" className="hover:text-white">
              Courses
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white">{category.name}</span>
          </nav>

          <div className="max-w-[775px]">
            <h1 className="font-suse text-[48px] font-bold leading-[1.2] text-white">
              {category.name}
            </h1>
            {category.description ? (
              <p className="mt-6 max-w-[856px] font-open-sans text-[18px] leading-[1.6] text-white/90">
                {category.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
