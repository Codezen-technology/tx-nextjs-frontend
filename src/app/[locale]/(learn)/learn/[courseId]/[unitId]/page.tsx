import { CoursePlayer } from "@/components/player/course-player";

interface PageProps {
  params: { courseId: string; unitId: string };
}

export default function LearnUnitPage({ params }: PageProps) {
  const courseId = Number(params.courseId);
  const unitId = Number(params.unitId);

  if (!Number.isFinite(courseId) || !Number.isFinite(unitId)) {
    return (
      <div className="container py-16">
        <h1 className="text-2xl font-semibold">Invalid unit</h1>
      </div>
    );
  }

  return <CoursePlayer courseId={courseId} unitId={unitId} />;
}
