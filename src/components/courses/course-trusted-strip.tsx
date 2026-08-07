const BADGES = [
  "Fully Accredited",
  "Instant Certificate",
  "Engaging video lectures",
  "Money-Back Guarantee",
];

export function CourseTrustedStrip() {
  return (
    <div className="border-neutral-30 bg-neutral-10 font-open-sans border-b py-2 text-sm text-neutral-700">
      <ul className="container flex max-w-[1296px] flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4">
        {BADGES.map((label) => (
          <li key={label} className="flex items-center gap-2">
            <span className="bg-primary-500 h-1.5 w-1.5 rounded-full" aria-hidden />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
