import { cn } from "@/lib/utils/cn";

interface CancellationsHeroProps {
  eyebrow: string;
  heading: string;
  text: string;
  align?: "left" | "center";
  /** Render this trailing segment as a bold brand-coloured accent (e.g. "out" in "We'll sort this out"). */
  headingEmphasis?: string;
  /** Show the green availability dot before the eyebrow. */
  showDot?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function renderHeading(heading: string, emphasis?: string) {
  if (!emphasis) {
    return heading;
  }

  const trimmed = heading.trimEnd();
  if (!trimmed.toLowerCase().endsWith(emphasis.toLowerCase())) {
    return heading;
  }

  const base = trimmed.slice(0, trimmed.length - emphasis.length);

  return (
    <>
      {base}
      <em className="text-primary-500 font-bold not-italic">{emphasis}</em>
    </>
  );
}

export function CancellationsHero({
  eyebrow,
  heading,
  text,
  align = "left",
  headingEmphasis,
  showDot = false,
  className,
  children,
}: CancellationsHeroProps) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <p className="font-open-sans text-primary-500 text-sm font-semibold tracking-wide uppercase">
        <span className="inline-flex items-center gap-2">
          {showDot ? (
            <span className="bg-player-success h-2 w-2 rounded-full" aria-hidden="true" />
          ) : null}
          {eyebrow}
        </span>
      </p>
      <h1 className="font-suse mt-3 text-3xl font-bold text-neutral-900 md:text-4xl">
        {renderHeading(heading, headingEmphasis)}
      </h1>
      <p className="font-open-sans mt-4 text-neutral-600">{text}</p>
      {children ? (
        <div className={cn("mt-8", align === "center" && "flex justify-center")}>{children}</div>
      ) : null}
    </div>
  );
}
