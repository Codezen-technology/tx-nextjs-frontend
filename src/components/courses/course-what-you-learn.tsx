interface CourseWhatYouLearnProps {
  html: string;
}

export function CourseWhatYouLearn({ html }: CourseWhatYouLearnProps) {
  if (!html) return null;

  return (
    <section>
      <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900 sm:text-[38px]">
        What you&apos;ll learn
      </h2>
      <div
        className="prose prose-neutral mt-6 max-w-none font-open-sans text-base leading-[1.6] text-neutral-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
