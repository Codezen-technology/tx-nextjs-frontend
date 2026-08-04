import { notFound } from "next/navigation";
import { NeutralSwatches, PrimarySwatches, SecondarySwatches } from "@/components/design-system";

export const metadata = {
  title: "Design System — Colours",
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  // Internal reference page. Useful in development, but a public, indexable
  // colour-palette dump on the production domain is not. 404 is a stronger
  // signal to a crawler than noindex.
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="bg-neutral-20 min-h-screen py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-2 text-4xl font-bold text-neutral-900">
          Training Excellence — Design System
        </h1>
        <p className="mb-10 text-base text-neutral-400">
          Colour palette sourced directly from Figma. Use these tokens via Tailwind utilities (e.g.{" "}
          <code className="bg-neutral-30 rounded px-1 py-0.5 font-mono text-sm text-neutral-700">
            bg-primary-500
          </code>
          ,{" "}
          <code className="bg-neutral-30 rounded px-1 py-0.5 font-mono text-sm text-neutral-700">
            text-secondary-700
          </code>
          ,{" "}
          <code className="bg-neutral-30 rounded px-1 py-0.5 font-mono text-sm text-neutral-700">
            border-neutral-40
          </code>
          ).
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <PrimarySwatches />
          <SecondarySwatches />
          <NeutralSwatches />
        </div>
      </div>
    </main>
  );
}
