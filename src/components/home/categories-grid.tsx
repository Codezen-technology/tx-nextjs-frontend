import Link from "next/link";
import { GraduationCap, ChevronRight } from "lucide-react";
import { serverApi, type ApiCategory } from "@/lib/api/server";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
}

interface CategoriesGridProps {
  categories?: CategoryItem[];
}

function resolveIcon(cat: CategoryItem): { type: "img"; src: string } | { type: "icon" } {
  return cat.image ? { type: "img", src: cat.image } : { type: "icon" };
}

function mapApiCategory(cat: ApiCategory): CategoryItem {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    image: cat.image,
  };
}

async function getCategories(provided?: CategoryItem[]): Promise<CategoryItem[]> {
  if (provided?.length) return provided;

  try {
    const res = await serverApi.taxonomy.categories({ per_page: 11 });
    if (res.items?.length) return res.items.map(mapApiCategory);
  } catch {
    return [];
  }

  return [];
}

export async function CategoriesGrid({ categories: provided }: CategoriesGridProps) {
  const categories = await getCategories(provided);

  if (!categories.length) return null;

  const displayed = categories.slice(0, 11);

  return (
    <div className="container">
      <div className="mb-6 flex flex-col items-end justify-between md:flex-row md:items-center">
        <h3 className="font-suse text-[32px] leading-normal font-bold text-neutral-900">
          Explore courses by category
        </h3>
        <Link
          href="/all-courses"
          className="font-open-sans text-secondary-500 hover:text-secondary-600 flex items-end gap-1 text-base font-normal transition-colors md:items-center"
        >
          View all courses
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
        {displayed.map((cat) => {
          const icon = resolveIcon(cat);
          return (
            <Link
              key={cat.id}
              href={`/course-cat/${cat.slug}`}
              className="group bg-secondary-50 hover:bg-primary-50 flex h-[196px] w-auto shrink-0 flex-col items-center justify-center gap-1 rounded-[8px] transition-all hover:shadow-xs"
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
              <span className="font-open-sans px-2 text-center text-base text-neutral-700 group-hover:text-neutral-900">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
