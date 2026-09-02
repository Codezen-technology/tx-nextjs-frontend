import Link from "next/link";

/**
 * QA-BLOG-A1: the report asks for 80px between this CTA and the footer, and the
 * frame agrees — card `4900:75889` ends at 5028, `Footer 2` starts at 5108. The
 * previous close put a `pb-20` wrapper *around* a section that already carried
 * `lg:py-16`, so the visible gap under the gradient card measured 144, not 80.
 * The 80 lives on the section itself now, and both consumers get it.
 */
export function BlogTeamCta() {
  return (
    <section className="pt-14 pb-20 lg:pt-16">
      <div className="container">
        <div
          className="flex flex-col items-center gap-6 py-14 text-center lg:py-16"
          style={{ background: "linear-gradient(113.58deg, #00204a 0%, #004f65 100%)" }}
        >
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
            // secondary-500 measures 4.42:1 against white — below the AA floor the
            // `interactive-contrast` spec sets. 600 is where the other 39 filled
            // surfaces went in the cancellations slice; this one was missed.
            className="bg-secondary-600 hover:bg-secondary-700 font-open-sans inline-flex w-50 items-center justify-center rounded-full px-6 py-4 text-base leading-normal text-white transition-colors"
          >
            Request A Quote
          </Link>
        </div>
      </div>
    </section>
  );
}
