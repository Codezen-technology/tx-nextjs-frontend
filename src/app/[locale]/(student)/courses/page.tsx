import { redirect } from "next/navigation";

export default async function StudentCoursesRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/all-courses`);
}
