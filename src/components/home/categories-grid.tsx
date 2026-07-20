import Link from "next/link";
import { Album, ChevronRight } from "lucide-react";
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
    const res = await serverApi.taxonomy.categories({ per_page: 12 });
    if (res.items?.length) return res.items.map(mapApiCategory);
  } catch {
    return [];
  }

  return [];
}

export async function CategoriesGrid({ categories: provided }: CategoriesGridProps) {
  const categories = await getCategories(provided);

  if (!categories.length) return null;

  const displayed = categories.slice(0, 12);

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {displayed.map((cat) => {
          const icon = resolveIcon(cat);
          return (
            <Link
              key={cat.id}
              href={`/course-cat/${cat.slug}`}
              className="group bg-neutral-0 hover:bg-secondary-500 flex h-[156px] flex-col items-center justify-start gap-4 px-4 py-6 transition-all"
            >
              <div className="bg-neutral-20 group-hover:bg-secondary-50 flex h-14 w-14 items-center justify-center overflow-hidden rounded transition-colors">
                {icon.type === "img" ? (
                  <img
                    src={encodeURI(icon.src)}
                    alt={cat.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                ) : (
                  <Album className="text-secondary-500 h-8 w-8" />
                )}
              </div>
              <span className="font-suse w-full text-center text-lg leading-[1.2] font-bold text-neutral-900 transition-colors group-hover:text-white">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
