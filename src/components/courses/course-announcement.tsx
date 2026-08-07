interface CourseAnnouncementProps {
  message: string;
}

export function CourseAnnouncement({ message }: CourseAnnouncementProps) {
  return (
    <div className="bg-secondary-50 font-open-sans relative px-4 py-2.5 text-center text-sm font-medium text-neutral-800">
      <span>{message}</span>
    </div>
  );
}
