import Link from "next/link";

export function BlogTeamCta() {
  return (
    <section
      className="py-14 lg:py-16"
      style={{ background: "linear-gradient(113.58deg, #00204a 0%, #004f65 100%)" }}
    >
      <div className="container flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-white">
            Want to Train Your Team?
          </h2>
          <p className="font-open-sans text-neutral-40 text-base leading-normal">
            Invest in your people. Get a bespoke training plan today.
          </p>
        </div>

        <Link
          href="/contact-us"
          className="bg-secondary-500 font-open-sans inline-flex w-50 items-center justify-center rounded-full px-6 py-4 text-base leading-normal text-white transition-opacity hover:opacity-90"
        >
          Request A Quote
        </Link>
      </div>
    </section>
  );
}
