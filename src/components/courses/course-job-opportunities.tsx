import { Briefcase } from "lucide-react";

interface JobOpportunitiesProps {
  heading: string;
  items: { title: string; description: string }[];
}

export function CourseJobOpportunities({ heading, items }: JobOpportunitiesProps) {
  if (!items.length) return null;

  return (
    <section id="job-opportunities" className="scroll-mt-28">
      <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900 sm:text-[38px]">
        {heading || "Job Opportunities"}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="border-neutral-30 flex gap-4 rounded-lg border bg-white p-5 shadow-xs"
          >
            <span className="bg-primary-50 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
              <Briefcase className="text-primary-600 h-4 w-4" />
            </span>
            <div>
              <p className="font-suse text-base font-bold text-neutral-900">{item.title}</p>
              {item.description && (
                <p className="font-open-sans mt-1 text-sm text-neutral-500">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
