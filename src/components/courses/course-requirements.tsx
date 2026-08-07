export function CourseRequirements({ html }: { html: string }) {
  return (
    <section id="requirements" className="scroll-mt-28">
      <h2 className="font-suse text-[32px] leading-[1.2] font-medium text-neutral-900">
        Requirements
      </h2>
      <div
        className="prose prose-neutral prose-p:my-0 font-open-sans mt-6 max-w-none text-base leading-normal text-neutral-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
