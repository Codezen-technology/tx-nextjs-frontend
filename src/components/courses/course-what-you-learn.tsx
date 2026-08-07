interface CourseWhatYouLearnProps {
  html: string;
}

export function CourseWhatYouLearn({ html }: CourseWhatYouLearnProps) {
  if (!html) return null;

  return (
    <section>
      <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900 sm:text-[38px]">
        What you&apos;ll learn
      </h2>
      <div
        className="prose prose-neutral font-open-sans mt-6 max-w-none text-base leading-[1.6] text-neutral-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
