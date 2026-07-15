import Link from "next/link";

/** Static "Home > About us" bar — Figma's Breadcrumb component (node 649:22656). */
export function AboutBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="bg-neutral-900 py-2.5">
      <div className="container">
        <p className="font-open-sans text-[16px] text-white">
          <Link href="/" className="font-bold underline hover:no-underline">
            Home
          </Link>{" "}
          <span aria-hidden="true">{">"}</span>{" "}
          <span aria-current="page" className="underline">
            About us
          </span>
        </p>
      </div>
    </nav>
  );
}
