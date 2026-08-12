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
    <section className="py-section bg-white lg:py-16">
      <div className="container mx-auto">
        <h2 className="font-suse mb-8 text-[2rem] font-bold text-neutral-900">Accreditations</h2>

        <div className="border-neutral-30 overflow-hidden rounded-[12px] border">
          {items.map((item, i) => (
            <div
              key={i}
              className="border-neutral-30 flex flex-col items-center gap-6 border-b p-6 last:border-b-0 sm:flex-row sm:items-start"
            >
              <div className="flex h-[108px] w-[152px] shrink-0 items-center justify-center">
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
                  className="max-h-20 w-20 object-contain"
                />
              </div>
              <div className="flex flex-col gap-2 text-center sm:text-left">
                <h3 className="font-suse text-lg font-bold text-neutral-900">{item.title}</h3>
                <p className="font-open-sans text-base leading-[1.6] text-neutral-600">
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
