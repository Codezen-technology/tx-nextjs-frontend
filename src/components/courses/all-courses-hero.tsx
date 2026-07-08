export function AllCoursesHero() {
  return (
    <div
      className="relative w-full"
      style={{ background: "linear-gradient(80.83deg,#00204a 0%,#004f65 100%)", minHeight: 320 }}
    >
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
