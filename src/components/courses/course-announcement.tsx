interface CourseAnnouncementProps {
  message: string;
}

export function CourseAnnouncement({ message }: CourseAnnouncementProps) {
  return (
    <div className="relative bg-secondary-50 px-4 py-2.5 text-center font-open-sans text-sm font-medium text-neutral-800">
      <span>{message}</span>
    </div>
  );
}
