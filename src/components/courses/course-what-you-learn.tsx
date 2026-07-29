interface CourseWhatYouLearnProps {
  html: string;
}

export function CourseWhatYouLearn({ html }: CourseWhatYouLearnProps) {
  if (!html) return null;

  return (
    <section>
      <h2 className="font-suse text-[32px] leading-[1.2] font-medium text-neutral-900">
        What you&apos;ll learn
      </h2>
      <div
        className="prose-wp font-open-sans mt-6 text-base leading-normal text-neutral-500"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
