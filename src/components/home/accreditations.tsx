import Image from "next/image";

interface AccreditationItem {
  src: string;
  alt: string;
  title: string;
  description: string;
}

const DEFAULT_ITEMS: AccreditationItem[] = [
  {
    src: "/images/cpd-logo.png",
    alt: "CPD Certified",
    title: "CPD Service Accredited",
    description:
      "Our courses are fully accredited by the CPD Certification Service, ensuring they meet recognised standards for Continuing Professional Development and align with UK professional learning guidelines.",
  },
  {
    src: "/images/ukrlp-logo.png",
    alt: "UKRLP Registered",
    title: "UKRLP Registered Provider",
    description:
      "We are registered with the UK Register of Learning Providers (UKRLP), confirming our status as a recognised training provider and reinforcing the credibility and transparency of our courses.",
  },
];

interface AccreditationsProps {
  items?: AccreditationItem[];
}

export function Accreditations({ items = DEFAULT_ITEMS }: AccreditationsProps) {
  if (!items.length) return null;

  return (
    <section className="py-section bg-white lg:pb-20">
      <div className="container mx-auto">
        <h2 className="font-suse mb-8 text-center text-2xl font-bold text-neutral-900 md:text-[32px]">
          Accreditations
        </h2>

        <div className="bg-secondary-50 space-y-4 rounded-lg p-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="border-neutral-30 flex flex-col gap-4 border-b pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-start"
            >
              <div className="flex h-27 w-full shrink-0 items-center justify-center rounded-lg bg-white sm:w-38">
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={80}
                  height={80}
                  // Never both axes auto: `width: auto` resolves against the
                  // source's intrinsic size, which is 0 for an image that fails
                  // to decode, collapsing the logo to a 0x0 box. Capping both
                  // axes keeps varied logo aspect ratios undistorted while
                  // guaranteeing a non-zero box.
                  className="font-open-sans px-2 text-center text-xs font-semibold text-neutral-600"
                />
              </div>
              <div className="border-secondary-500 min-w-0 flex-1 border-l py-4 pr-4 pl-4">
                <h3 className="font-open-sans text-base font-bold text-black">{item.title}</h3>
                <p className="font-open-sans mt-2 text-sm leading-relaxed font-normal text-black">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
