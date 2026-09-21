import Image from "next/image";

export function HomeAbout() {
  return (
    <section
      id="tentang"
      className="mx-auto w-full grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2"
    >
      <div className="relative h-72 overflow-hidden rounded-2xl bg-[#f7ece4] md:h-80">
        <Image
          src="https://images.unsplash.com/photo-1538334421852-687c439c92f4?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Palatia open kitchen"
          fill
          className="object-cover"
        />
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[2px] text-[#b8521f]">
          ABOUT US
        </p>
        <h2 className="mt-3 font-brand text-3xl font-semibold text-[#2b2119] md:text-4xl">
          An open kitchen, honest ingredients.
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5c5147]">
          Every dish has a measured recipe — from kitchen to stockroom,
          everything is tracked. That is why the taste stays consistent, every
          day, every plate.
        </p>
        <div className="mt-8 flex gap-10">
          {[
            ["9 yrs", "in business"],
            ["40+", "menu items"],
            ["120k", "plates served"],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="font-brand text-3xl font-semibold text-[#b8521f]">
                {num}
              </p>
              <p className="mt-1 text-xs text-[#5c5147]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
