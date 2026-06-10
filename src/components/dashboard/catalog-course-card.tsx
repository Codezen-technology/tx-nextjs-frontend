"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, LogIn, ShoppingCart, TriangleAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SafeImage } from "@/components/ui/safe-image";
import { useAddToCart } from "@/lib/hooks/useCart";
import { getCourseContinueUrl } from "@/lib/utils/student-dashboard";
import { cn } from "@/lib/utils/cn";
import type { StudentCourse } from "@/types/student-dashboard";

const FALLBACK = "/dashboard/no-image.jpg";

function formatPrice(price: number, currency: string): string {
  return `${currency}${price.toFixed(2).replace(/\.00$/, "")}`;
}

/** Status button label from enrollment + progress. */
function statusLabel(progress: number): string {
  return progress > 0 ? "Continue" : "Start Course";
}

type CartState = "idle" | "loading" | "success" | "error";

function AddToCartButton({
  productId,
  courseName,
  full,
}: {
  productId: number;
  courseName: string;
  full?: boolean;
}) {
  const [state, setState] = useState<CartState>("idle");
  const { mutate } = useAddToCart();

  useEffect(() => {
    if (state === "success" || state === "error") {
      const t = setTimeout(() => setState("idle"), state === "success" ? 2000 : 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  const handleClick = () => {
    if (state !== "idle") return;
    setState("loading");
    mutate(
      { product_id: productId },
      {
        onSuccess: () => {
          setState("success");
          window.dispatchEvent(new CustomEvent("open-cart-sidebar"));
        },
        onError: () => setState("error"),
      },
    );
  };

  const config: Record<CartState, { bg: string; icon: React.ReactNode; label: string }> = {
    idle: {
      bg: "bg-[#3f4d97] hover:bg-[#0f217d]",
      icon: <ShoppingCart className="h-5 w-5" />,
      label: "Add to Cart",
    },
    loading: {
      bg: "bg-[#3f4d97]",
      icon: <Loader2 className="h-4 w-4 animate-spin" />,
      label: "Adding…",
    },
    success: {
      bg: "bg-[#2e7d32]",
      icon: <Check className="h-5 w-5" />,
      label: "Added!",
    },
    error: {
      bg: "bg-[#c62828]",
      icon: <TriangleAlert className="h-5 w-5" />,
      label: "Failed",
    },
  };
  const cfg = config[state];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      aria-label={`Add ${courseName} to cart`}
      className={cn(
        "flex h-12 items-center justify-center gap-2 text-sm font-semibold text-[#f6f6fa] transition-colors",
        cfg.bg,
        full ? "w-full" : "flex-1",
        state === "loading" && "cursor-not-allowed",
      )}
    >
      {cfg.icon}
      <span className="whitespace-nowrap">{cfg.label}</span>
    </button>
  );
}

function StatusButton({
  href,
  progress,
  full,
}: {
  href: string;
  progress: number;
  full?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-12 items-center justify-center gap-2 bg-[#2e4450] text-sm font-semibold text-[#f6f6fa] transition-colors hover:bg-[#1a2d38]",
        full ? "w-full" : "flex-1",
      )}
    >
      <span className="whitespace-nowrap">{statusLabel(progress)}</span>
      <LogIn className="h-5 w-5" />
    </Link>
  );
}

export function CatalogCourseCard({ course }: { course: StudentCourse }) {
  const productId = course.product_id ? Number(course.product_id) : null;
  const isEnrolled = !!course.is_enrolled;
  const progress = course.user_progress ?? 0;
  const firstCategory = course.course_cat_names?.[0];
  const continueUrl = getCourseContinueUrl(course);

  const showPrice =
    productId != null && course.price != null && !course.is_free && !!course.currency;
  const savePct =
    showPrice && course.regular_price && course.regular_price > course.price!
      ? Math.round(((course.regular_price - course.price!) / course.regular_price) * 100)
      : null;

  const renderFooter = () => {
    if (isEnrolled && productId) {
      return (
        <div className="flex w-full">
          <StatusButton href={continueUrl} progress={progress} />
          <AddToCartButton productId={productId} courseName={course.name} />
        </div>
      );
    }
    if (isEnrolled) {
      return <StatusButton href={continueUrl} progress={progress} full />;
    }
    if (productId) {
      return <AddToCartButton productId={productId} courseName={course.name} full />;
    }
    return (
      <Link
        href={course.link || continueUrl}
        target={course.link ? "_blank" : undefined}
        rel={course.link ? "noopener noreferrer" : undefined}
        className="flex h-12 w-full items-center justify-center gap-2 bg-[#3f4d97] text-sm font-semibold text-[#f6f6fa] transition-colors hover:bg-[#0f217d]"
      >
        <ShoppingCart className="h-5 w-5" />
        <span>View Course</span>
      </Link>
    );
  };

  return (
    <article className="flex w-full flex-col self-stretch overflow-hidden rounded-2xl bg-[#f6f6fa] transition-shadow hover:shadow-lg">
      <div className="relative h-44 shrink-0 overflow-hidden">
        <SafeImage
          src={course.featured_image || FALLBACK}
          alt={course.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 min-h-[2.7em] text-[17px] font-bold leading-snug text-[#2e4450]">
          {course.name}
        </h3>

        {showPrice && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[22px] font-extrabold leading-none text-[#3f4d97]">
              {formatPrice(course.price!, course.currency!)}
            </span>
            {course.regular_price && course.regular_price > course.price! && (
              <span className="text-sm font-medium text-[#9aa5ac] line-through">
                {formatPrice(course.regular_price, course.currency!)}
              </span>
            )}
            {savePct !== null && (
              <span className="rounded bg-[#fff3e0] px-1.5 py-0.5 text-[11px] font-bold leading-none text-[#e65100]">
                {savePct}% OFF
              </span>
            )}
          </div>
        )}

        {!showPrice && course.is_free && (
          <span className="text-[13px] font-semibold text-[#2e7d32]">Free</span>
        )}
        {!showPrice && isEnrolled && !course.is_free && (
          <span className="text-[13px] font-semibold text-[#3f4d97]">Enrolled</span>
        )}

        {firstCategory && (
          <span className="self-start rounded border border-[#d0d5ef] bg-[#eef0f9] px-2 py-0.5 text-[11px] font-semibold text-[#3f4d97]">
            {firstCategory}
          </span>
        )}

        <div className="flex-1" />

        {isEnrolled && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#73828a]">Progress</span>
              <span className="text-xs font-bold text-[#2e4450]">{progress}%</span>
            </div>
            <Progress
              value={Math.min(100, Math.max(0, progress))}
              className="h-1.5 bg-[#e2e8ee] [&>div]:bg-[#3f4d97]"
            />
          </div>
        )}
      </div>

      {renderFooter()}
    </article>
  );
}

export function CatalogCourseCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-[#f6f6fa]">
      <Skeleton className="h-44 w-full rounded-none bg-[#e2e8ee]" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-6 w-[90%] bg-[#e2e8ee]" />
        <Skeleton className="h-5 w-2/5 bg-[#e2e8ee]" />
        <Skeleton className="h-4 w-1/3 bg-[#e2e8ee]" />
      </div>
      <Skeleton className="h-12 w-full rounded-none bg-[#c9cfe8]" />
    </div>
  );
}
