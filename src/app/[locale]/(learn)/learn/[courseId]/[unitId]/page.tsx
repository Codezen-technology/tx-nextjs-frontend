import { CoursePlayer } from "@/components/player/course-player";

interface PageProps {
  params: Promise<{ courseId: string; unitId: string }>;
}

export default async function LearnUnitPage({ params }: PageProps) {
  const { courseId: courseIdStr, unitId: unitIdStr } = await params;
  const courseId = Number(courseIdStr);
  const unitId = Number(unitIdStr);

  if (!Number.isFinite(courseId) || !Number.isFinite(unitId)) {
    return (
      <div className="container py-16">
        <h1 className="text-2xl font-semibold">Invalid unit</h1>
      </div>
    );
  }

  return <CoursePlayer courseId={courseId} unitId={unitId} />;
}
