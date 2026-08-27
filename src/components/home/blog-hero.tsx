import { Search } from "lucide-react";
import { HeroWave } from "../courses/hero-wave";

/**
 * `2xl` carries the measured 1920 inset: band `4900:75793` is 320 tall around
 * content ending at 235, so 85. `md:py-28` below it is main's design call for
 * 768–1535 and is left alone — the 1280 frame measures 64, but the report signs
 * that width off as working, so it is recorded in `targets.md` rather than
 * applied. QA-BLOG-A2 is scoped to 1920.
 */
export function BlogHero() {
  return (
    <section className="relative overflow-hidden bg-neutral-900 py-14 md:py-28 2xl:py-[85px]">
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <HeroWave />
      <div className="relative container">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="font-open-sans text-sm font-normal text-white/70">
              Training Excellence&apos;s
            </p>
            <h1 className="font-suse mt-1 text-4xl font-bold text-white md:text-5xl">
              Blogs &amp; Updates
            </h1>
            <p className="font-open-sans mt-3 text-base text-white/70">
              Your Go-To Hub for Insights &amp; Career-Boosting Knowledge.
            </p>
          </div>
          <form
            action="/search"
            method="get"
            className="flex w-full max-w-sm shrink-0 overflow-hidden rounded-lg shadow-lg"
          >
            <input
              name="q"
              type="search"
              placeholder="Search..."
              className="font-open-sans flex-1 bg-white px-4 py-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-hidden"
            />
            <button
              type="submit"
              className="bg-secondary-600 font-open-sans hover:bg-secondary-700 flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white transition-colors"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
