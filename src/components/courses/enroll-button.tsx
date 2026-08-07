"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { useEnroll, useIsEnrolled, useMyEnrollments } from "@/lib/hooks/useEnrollments";

interface EnrollButtonProps {
  courseId: number;
  isFree?: boolean;
  price?: number;
}

export function EnrollButton({ courseId, isFree, price }: EnrollButtonProps) {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuth();
  const { data: enrollments } = useMyEnrollments({ enabled: isAuthenticated });
  const enrolled = useIsEnrolled(courseId, enrollments);
  const enroll = useEnroll();

  if (!hasHydrated) {
    return (
      <Button size="lg" disabled>
        <Loader2 className="animate-spin" /> Loading
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button size="lg" asChild>
        <Link href={`/login?next=/course/${courseId}`}>
          <GraduationCap />
          {isFree ? "Sign in to enroll" : `Sign in to enroll${price ? ` \u2014 $${price}` : ""}`}
        </Link>
      </Button>
    );
  }

  if (enrolled) {
    const lastUnit = enrolled.lastAccessedUnitId;
    const target = lastUnit ? `/learn/${courseId}/${lastUnit}` : `/learn/${courseId}/start`;
    return (
      <Button size="lg" asChild>
        <Link href={target}>
          <BookOpen />
          Continue learning
        </Link>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      onClick={() =>
        enroll.mutate(
          { courseId },
          {
            onSuccess: () => router.push(`/learn/${courseId}/start`),
          },
        )
      }
      disabled={enroll.isPending}
    >
      {enroll.isPending ? <Loader2 className="animate-spin" /> : <GraduationCap />}
      {isFree ? "Enroll for free" : `Enroll${price ? ` \u2014 $${price}` : ""}`}
    </Button>
  );
}
