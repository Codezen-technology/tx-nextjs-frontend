import Image from "next/image";

export function AllCoursesHero() {
  return (
    <div
      className="relative w-full"
      style={{
        background: "linear-gradient(88deg, rgb(0, 32, 74) 0%, rgb(0, 79, 101) 100.15%)",
        minHeight: 320,
      }}
    >
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
      <div className="mx-auto flex max-w-[1296px] items-center gap-[179px] px-4 py-[112px]">
        <div className="shrink-0">
          <p className="font-suse text-[40px] leading-[1.2] font-light text-white">Explore</p>
          <p className="font-suse text-[40px] leading-[1.2] font-bold text-white">Our Courses</p>
        </div>
        <p className="font-open-sans text-neutral-30 max-w-[856px] text-[20px] leading-normal font-light">
          The range of courses we offer is versatile, aiming to provide you with the best experience
          that will help you meet your personal, professional, and business goals.
        </p>
      </div>
    </div>
  );
}
