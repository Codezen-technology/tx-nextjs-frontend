interface CourseAboutProps {
  heading?: string | null;
  html: string;
}

export function CourseAbout({ heading, html }: CourseAboutProps) {
  return (
    <section>
      <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900 sm:text-[38px]">
        {heading ?? "About course"}
      </h2>
      <div
        className="prose prose-neutral mt-6 max-w-none font-open-sans text-base leading-[1.5] text-neutral-700 prose-p:my-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
