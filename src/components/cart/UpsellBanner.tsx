import Link from "next/link";
import { CheckCircle } from "lucide-react";

const FEATURES = [
  "1 Year Access to 3000+ Courses",
  "Unlimited PDF Certificates",
  "Unlimited PDF Transcripts",
  "Free Student ID Card & More",
];

interface UpsellBannerProps {
  variant?: "cart" | "checkout";
}

export function UpsellBanner({ variant = "cart" }: UpsellBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-lg" style={{ background: "linear-gradient(6deg, #00204a 9%, #1c395e 92%)" }}>
      {/* Most Popular badge */}
      <div className="absolute right-0 top-0">
        <div
          className="px-4 py-1.5 text-xs font-medium text-[#00204a]"
          style={{ background: "linear-gradient(69deg, #01aee0 0%, #00c7ff 100%)" }}
        >
          Most Popular
        </div>
      </div>

      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Title + price */}
        <div>
          <p className="text-sm font-semibold text-[#00bbf0]">Lifetime Prime Plus</p>
          <p className="mt-1 text-[#dc3545] line-through text-xl font-bold">£599</p>
          <p className="text-2xl font-bold text-white">
            £249<span className="text-base font-normal">/Year</span>
          </p>
        </div>

        {/* Feature list */}
        <ul className="space-y-1.5">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-white">
              <CheckCircle size={14} className="shrink-0 text-[#00bbf0]" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="flex flex-col items-center gap-2 sm:w-56">
          <Link
            href="/membership"
            className="w-full rounded-full border border-[#00bbf0] bg-gradient-to-r from-[#00bbf0] to-[#8ae0f8] px-6 py-2.5 text-center text-sm font-medium text-[#00204a] hover:opacity-90"
          >
            {variant === "cart" ? "Add to Cart" : "Start Today"}
          </Link>
          <Link href="/membership" className="text-xs text-white underline underline-offset-2 hover:text-gray-300">
            View more details
          </Link>
        </div>
      </div>
    </div>
  );
}
