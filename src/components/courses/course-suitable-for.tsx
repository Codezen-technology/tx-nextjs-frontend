import type { CourseSuitableForItem } from "@/types/course";

interface CourseSuitableForProps {
  heading?: string;
  items: CourseSuitableForItem[];
}

export function CourseSuitableFor({ heading, items }: CourseSuitableForProps) {
  if (!items.length) return null;

  return (
    <div className="space-y-6">
      <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900 sm:text-[38px]">
        {heading || "Who is this course suitable for?"}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3.5 shadow-sm"
          >
            {item.icon ? (
              <img
                src={item.icon}
                alt=""
                className="h-6 w-6 shrink-0 object-contain"
                loading="lazy"
              />
            ) : (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
            )}
            <span className="font-open-sans text-sm font-medium text-neutral-800">
              {item.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
