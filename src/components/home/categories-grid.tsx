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
    // One grid, three children. The CTA keeps its place in the DOM — heading,
    // CTA, grid — and only moves visually, dropping below the grid at mobile via
    // `order-last` (QA-HOME-A7). Rendering it twice behind `hidden`/`md:block`
    // would give it two accessible names; moving it in the DOM instead would put
    // desktop focus order behind all twelve category links.
    <div className="container grid grid-cols-1 md:grid-cols-[1fr_auto] md:items-center">
      <h3 className="font-suse mb-6 text-[32px] leading-normal font-bold text-neutral-900">
        Explore courses by category
      </h3>
      <Link
        href="/all-courses"
        className="font-open-sans text-secondary-500 hover:text-secondary-600 order-last mt-6 flex items-end gap-1 justify-self-end text-base font-normal transition-colors md:order-none md:mt-0 md:mb-6 md:items-center"
      >
        View all courses
        <ChevronRight className="h-4 w-4" />
      </Link>

      <div className="grid grid-cols-2 md:col-span-2 md:grid-cols-3 lg:grid-cols-6">
        {displayed.map((cat) => {
          const icon = resolveIcon(cat);
          return (
            <Link
              key={cat.id}
              href={`/course-cat/${cat.slug}`}
              className="group bg-neutral-0 hover:bg-secondary-500 flex h-39 flex-col items-center justify-start gap-4 px-4 py-6 transition-all"
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
