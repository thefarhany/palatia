import { CalendarCheck, QrCode, Radar, Scale } from "lucide-react";

const FEATURES = [
  { no: "01", icon: QrCode, title: "QR at your table", desc: "Scan, order, pay — no waiting for a waiter." },
  { no: "02", icon: Radar, title: "Live cooking status", desc: "Real-time kitchen updates sent straight to your phone." },
  { no: "03", icon: Scale, title: "Measured ingredients", desc: "Controlled recipes — consistent taste in every plate." },
  { no: "04", icon: CalendarCheck, title: "Easy reservations", desc: "Pick a date & slot, instant confirmation." },
];

export function HomeFeatures() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <p className="text-xs font-semibold tracking-[2px] text-[#b8521f]">WHY PALATIA</p>
      <h2 className="mt-3 font-brand text-3xl font-semibold text-[#2b2119] md:text-4xl">
        Great food, zero hassle.
      </h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.no}
            className={`rounded-2xl border p-6 ${
              i === 0 ? "border-[#b8521f] bg-[#b8521f] text-white" : "border-[#f0e8de] bg-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <span className={`grid size-10 place-items-center rounded-lg ${i === 0 ? "bg-white/15" : "bg-[#f7ece4]"}`}>
                <f.icon className={`size-5 ${i === 0 ? "text-white" : "text-[#b8521f]"}`} />
              </span>
              <span className={`font-brand text-3xl font-semibold ${i === 0 ? "text-white" : "text-[#2b2119]"}`}>
                {f.no}
              </span>
            </div>
            <p className="mt-8 text-sm font-semibold">{f.title}</p>
            <p className={`mt-1 text-xs leading-relaxed ${i === 0 ? "text-white/75" : "text-[#5c5147]"}`}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
