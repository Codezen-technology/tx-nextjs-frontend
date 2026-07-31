import Image from "next/image";
//import Link from "next/link";
//import { ChevronRight, Home } from "lucide-react";
import type { ApiCategory } from "@/lib/api/server";

interface CategoryHeroProps {
  category: ApiCategory;
}

export function CategoryHero({ category }: CategoryHeroProps) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 350 }}>
      {/* {category.image ? (
        <Image src={category.image} alt={category.name} fill className="object-cover" priority />
      ) : (
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(80.83deg, #00204a 0%, #004f65 100%)" }}
        />
      )} */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(88deg, rgb(0, 32, 74) 0%, rgb(0, 79, 101) 100.15%)" }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 overflow-hidden opacity-10 sm:h-20">
        <div className="absolute top-0 left-1/2 flex h-[405.89px] w-[max(100%,1920px)] -translate-x-1/2 items-center justify-center">
          <div className="shrink-0 -rotate-90">
            <Image
              src="/images/course-banner-wave.svg"
              alt=""
              width={406}
              height={1920}
              decoding="async"
              className="block h-[1920px] w-[405.89px] max-w-none"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex h-full flex-col justify-center">
        <div className="mx-auto w-full max-w-[1296px] px-4">
          {/* Breadcrumb */}
          {/* <nav className="font-open-sans mb-6 flex items-center gap-1.5 text-sm text-white/70">
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
          </nav> */}

          <div className="max-w-[775px]">
            <h1 className="font-suse text-[48px] leading-[1.2] font-bold text-white">
              {category.name}
            </h1>
            {category.description ? (
              <p className="font-open-sans mt-6 max-w-[856px] text-[18px] leading-[1.6] text-white/90">
                {category.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
