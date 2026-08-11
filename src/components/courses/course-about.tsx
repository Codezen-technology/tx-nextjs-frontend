interface CourseAboutProps {
  heading?: string | null;
  html: string;
}

export function CourseAbout({ heading, html }: CourseAboutProps) {
  return (
    <section>
      <h2 className="font-suse text-[32px] leading-[1.2] font-bold text-neutral-900">
        {heading ?? "About course"}
      </h2>
      <div
        className="prose prose-neutral font-open-sans prose-p:my-0 mt-6 max-w-none text-base leading-normal text-neutral-500"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
