import { ClipboardList, Eye, Scale, Timer } from "lucide-react";

const VALUES = [
  { icon: Scale, title: "Honest Ingredients", desc: "Bought fresh every morning, cooked the same day. Minimal waste, maximum quality." },
  { icon: ClipboardList, title: "Measured Recipes", desc: "Every menu has documented ingredient ratios — the base of our stockroom." },
  { icon: Timer, title: "Fast Service", desc: "QR order + live status. Guests chat, not wait for a waiter." },
  { icon: Eye, title: "Open Kitchen", desc: "Watch the cooking process from your table. Nothing to hide." },
];

export function AboutValues() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl border border-[#f0e8de] bg-white p-6">
            <span className="grid size-10 place-items-center rounded-lg bg-[#f7ece4]">
              <v.icon className="size-5 text-[#b8521f]" />
            </span>
            <p className="mt-4 text-sm font-semibold text-[#2b2119]">{v.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#5c5147]">{v.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
