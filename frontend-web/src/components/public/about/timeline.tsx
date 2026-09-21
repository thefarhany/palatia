import Image from "next/image";

const TIMELINE = [
  [
    "2016",
    "A four-seat warung on our home terrace. Only 5 dishes on the menu.",
  ],
  ["2019", "Moved to a two-storey shopfront, our first open kitchen."],
  ["2022", "QR ordering & digital kitchen — queues gone, portions up 3x."],
  ["2026", "40+ menus, 120 thousand plates served, a team of 24."],
] as const;

export function AboutTimeline() {
  return (
    <section className="mx-auto w-full grid max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
      <div>
        <h2 className="font-brand text-3xl font-semibold text-[#2b2119] md:text-4xl">
          Our journey.
        </h2>
        <div className="mt-8 grid gap-6">
          {TIMELINE.map(([year, desc]) => (
            <div key={year} className="flex items-baseline gap-6">
              <p className="font-brand text-3xl font-semibold text-[#b8521f]">
                {year}
              </p>
              <p className="text-sm leading-relaxed text-[#5c5147]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="relative h-72 overflow-hidden rounded-2xl bg-[#f7ece4] lg:h-[420px]">
        <Image
          src="https://images.unsplash.com/photo-1541557435984-1c79685a082b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="The Palatia journey"
          fill
          className="object-cover"
        />
      </div>
    </section>
  );
}
