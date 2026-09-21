const TESTIMONIALS = [
  {
    quote: "Ordered via QR, it was processed in 5 minutes. My kids love watching the cooking status.",
    name: "Sari Dewi",
    tag: "Customer since 2019",
  },
  {
    quote: "The rendang is consistent. Two years of ordering, it has never changed.",
    name: "Bagus Wicaksono",
    tag: "Food Vlogger",
  },
  {
    quote: "Booking an evening slot is so easy — we arrive and sit right away.",
    name: "Maya Putri",
    tag: "Regular customer",
  },
];

export function HomeTestimonials() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-16">
      <h2 className="font-brand text-3xl font-semibold text-[#2b2119] md:text-4xl">What they say.</h2>
      <p className="mt-2 text-sm text-[#5c5147]">4.9/5 from 1,200+ customer reviews on Google Maps.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="rounded-2xl border border-[#f0e8de] bg-white p-6">
            <p className="text-sm tracking-[2px] text-[#b8521f]">★★★★★</p>
            <p className="mt-3 font-brand text-lg leading-snug text-[#2b2119]">“{t.quote}”</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-[#f0d9c8] text-xs font-semibold text-[#b8521f]">
                {t.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#2b2119]">{t.name}</p>
                <p className="text-xs text-[#5c5147]">{t.tag}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
