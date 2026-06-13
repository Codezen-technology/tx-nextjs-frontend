import { Briefcase } from "lucide-react";

interface JobOpportunitiesProps {
  heading: string;
  items: { title: string; description: string }[];
}

export function CourseJobOpportunities({ heading, items }: JobOpportunitiesProps) {
  if (!items.length) return null;

  return (
    <section id="job-opportunities" className="scroll-mt-28">
      <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900 sm:text-[38px]">
        {heading || "Job Opportunities"}
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex gap-4 rounded-lg border border-[#ebedf1] bg-white p-5 shadow-sm"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50">
              <Briefcase className="h-4 w-4 text-primary-600" />
            </span>
            <div>
              <p className="font-suse text-base font-bold text-[#00204a]">{item.title}</p>
              {item.description && (
                <p className="mt-1 font-open-sans text-sm text-[#3b5374]">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
