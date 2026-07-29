const BADGES = [
  { label: "Fully Accredited", icon: "/icons/star.svg" },
  { label: "Instant Certificate", icon: "/icons/wifi.svg" },
  { label: "Engaging video lectures", icon: "/icons/medal.svg" },
  { label: "Money-Back Guarantee", icon: "/icons/money-back.svg" },
];

export function CourseTrustedStrip() {
  return (
    <div className="border-neutral-30 bg-neutral-10 font-open-sans border-b py-2 text-sm text-neutral-700">
      <ul className="container flex max-w-324 flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4">
        {BADGES.map(({ label, icon }) => (
          <li key={label} className="flex items-center gap-2">
            <img src={icon} alt="" aria-hidden="true" width={16} height={16} />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
