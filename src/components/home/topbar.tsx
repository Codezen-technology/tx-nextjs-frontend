import trustItems from "@/data/home/topbar.json";

export function Topbar() {
  return (
    <div className="bg-white">
      <div className="container flex flex-wrap items-center justify-between py-2">
        {trustItems.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <img
              src={item.icon}
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
              className="shrink-0"
            />
            <span className="font-open-sans text-sm font-normal leading-[1.5] text-neutral-500">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}