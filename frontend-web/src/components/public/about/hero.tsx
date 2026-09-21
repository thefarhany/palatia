import Image from "next/image";

export function AboutHero() {
  return (
    <section className="mx-auto w-full grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
      <div>
        <p className="text-xs font-semibold tracking-[2px] text-[#b8521f]">
          ABOUT PALATIA
        </p>
        <h1 className="mt-4 font-brand text-4xl font-semibold leading-[1.15] text-[#2b2119] md:text-5xl">
          Home cooking, taken seriously.
        </h1>
        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-[#5c5147]">
          Palatia started in 2016 from a 4-seat home kitchen. The principle was
          simple: buy fresh ingredients in the morning, cook that day, measure
          every recipe. Ten years later, the way we work is still the same —
          only the scale has grown.
        </p>
      </div>
      <div className="relative h-64 overflow-hidden rounded-2xl bg-[#f7ece4] md:h-80">
        <Image
          src="https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Palatia kitchen"
          fill
          className="object-cover"
          priority
        />
      </div>
    </section>
  );
}
