import Link from "next/link";
import { GraduationCap, ChevronRight } from "lucide-react";
import categoriesData from "@/data/home/categories.json";

type CategoryItem = (typeof categoriesData)[number];

function resolveIcon(cat: CategoryItem): { type: "img"; src: string } | { type: "icon" } {
  return cat.image ? { type: "img", src: cat.image } : { type: "icon" };
}

async function getCategories(): Promise<CategoryItem[]> {
  return categoriesData;
}

export async function CategoriesGrid() {
  const categories = await getCategories();

  if (!categories.length) return null;

  // Static Figma order: 11 tiles (6 + 5)
  const displayed = categories.slice(0, 11);

  return (
    <div className="container">
      {/* Header — Figma: SUSE Bold 32px, "View all" secondary-500 */}
      <div className="mb-6 flex flex-col md:flex-row items-end md:items-center justify-between">
        <h3 className="font-suse text-[32px] font-bold leading-normal text-neutral-900">
          Explore courses by category
        </h3>
        <Link
          href="/courses"
          className="flex items-end md:items-center gap-1 font-open-sans text-base font-normal text-secondary-500 transition-colors hover:text-secondary-600"
        >
          View all courses
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {displayed.map((cat) => {
          const icon = resolveIcon(cat);
          return (
            <Link
              key={cat.id}
              href={`/course-cat/${cat.slug}`}
              className="group flex h-[196px] w-auto shrink-0 flex-col items-center justify-center gap-1 rounded-[8px] bg-secondary-50 transition-all hover:bg-primary-50 hover:shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden">
                {icon.type === "img" ? (
                  <img
                    src={encodeURI(icon.src)}
                    alt={cat.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 object-contain"
                  />
                ) : (
                  <GraduationCap className="h-8 w-8 text-neutral-300" />
                )}
              </div>
              <span className="px-2 text-center font-open-sans text-base text-neutral-300 group-hover:text-neutral-500">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
