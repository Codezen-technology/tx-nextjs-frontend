import { Check, X } from "lucide-react";
import type { HomePricingPlan } from "@/types/home";
import { cn } from "@/lib/utils/cn";

interface PricingComparisonProps {
  plans?: HomePricingPlan[];
  title?: string;
}

export function PricingComparison({ plans, title = "What You'll Get" }: PricingComparisonProps) {
  if (!plans?.length) return null;

  // Row labels = union of all feature labels across plans, first-seen order.
  const labels: string[] = [];
  for (const plan of plans) {
    for (const feat of plan.features) {
      if (!labels.includes(feat.label)) labels.push(feat.label);
    }
  }
  if (!labels.length) return null;

  // Quick lookup: per plan, label → included.
  const included = plans.map(
    (plan) => new Map(plan.features.map((f) => [f.label, f.included] as const)),
  );

  return (
    <section className="bg-white py-20">
      <div className="container mx-auto">
        <h2 className="mb-12 text-center font-suse text-[2rem] font-bold text-neutral-900">
          {title}
        </h2>

        <div className="overflow-x-auto rounded-[12px] border border-[#ebedf1]">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[#ebedf1] bg-neutral-50">
                <th className="px-6 py-5 font-suse text-base font-bold text-neutral-900">
                  Included Features
                </th>
                {plans.map((plan) => (
                  <th key={plan.name} className="px-6 py-5 text-center">
                    {plan.badge === "best-value" && (
                      <span className="mb-1 inline-block rounded-full bg-[#e1d2ba] px-3 py-0.5 text-xs font-medium text-secondary-700">
                        Best Value
                      </span>
                    )}
                    {plan.badge === "most-popular" && (
                      <span
                        className="mb-1 inline-block rounded-full px-3 py-0.5 text-xs font-medium text-neutral-900"
                        style={{ background: "linear-gradient(85deg, #01aee0 0%, #00c7ff 100%)" }}
                      >
                        Most Popular
                      </span>
                    )}
                    <span className="block font-suse text-base font-bold text-neutral-900">
                      {plan.name}
                    </span>
                    <span className="mt-1 flex items-baseline justify-center gap-1.5">
                      {plan.originalPrice && (
                        <span className="text-sm font-bold text-[#dc3545] line-through">
                          {plan.originalPrice}
                        </span>
                      )}
                      <span className="font-suse text-lg font-bold text-secondary-600">
                        {plan.price}
                      </span>
                      {plan.priceUnit && (
                        <span className="text-xs text-neutral-500">{plan.priceUnit}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, rowIdx) => (
                <tr
                  key={label}
                  className={cn(
                    "border-b border-[#ebedf1] last:border-b-0",
                    rowIdx % 2 === 1 && "bg-neutral-50/50",
                  )}
                >
                  <td className="px-6 py-4 font-open-sans text-base text-neutral-900">{label}</td>
                  {included.map((map, colIdx) => {
                    const has = map.get(label) === true;
                    return (
                      <td key={colIdx} className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center">
                          {has ? (
                            <Check className="h-5 w-5 text-secondary-500" aria-label="Included" />
                          ) : (
                            <X className="h-5 w-5 text-neutral-300" aria-label="Not included" />
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
