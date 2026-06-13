export function CourseWhyTake({ html }: { html: string }) {
  return (
    <section id="why-take" className="scroll-mt-28">
      <h2 className="font-suse text-[32px] font-bold leading-[1.2] text-neutral-900 sm:text-[38px]">
        Why take this course?
      </h2>
      <div
        className="prose prose-neutral prose-p:my-0 mt-6 max-w-none font-open-sans text-base leading-[1.5] text-neutral-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
