import { redirect } from "next/navigation";

export default function StudentCoursesRedirect({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/dashboard/all-courses`);
}
