interface CourseWhatYouLearnProps {
  items: string[];
}

export function CourseWhatYouLearn({ items }: CourseWhatYouLearnProps) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900 sm:text-[38px]">
        What you&apos;ll learn
      </h2>
      <div className="mt-6 space-y-4 font-open-sans text-base leading-[1.6] text-neutral-700">
        {items.map((item, i) => (
          <p key={i}>{item}</p>
        ))}
      </div>
    </section>
  );
}
