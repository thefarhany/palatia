import Image from "next/image";

const TEAM = [
  { name: "Rina Kusuma", role: "Head Chef", desc: "12 years in kitchens, designer of every recipe." },
  { name: "Joko Susilo", role: "Sous Chef", desc: "Keeps the taste consistent on every shift." },
  { name: "Sari Dewi", role: "Service Lead", desc: "Trains the floor team & owns the guest experience." },
];

export function AboutTeam() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-20">
      <h2 className="font-brand text-3xl font-semibold text-[#2b2119] md:text-4xl">The people behind it.</h2>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {TEAM.map((t) => (
          <div key={t.name} className="rounded-2xl border border-[#f0e8de] bg-white p-6">
            <div className="relative size-16 overflow-hidden rounded-full bg-[#f7ece4]">
              <Image
                src={`https://picsum.photos/seed/palatia-team-${t.name.split(" ")[0].toLowerCase()}/200/200`}
                alt={t.name}
                fill
                className="object-cover"
              />
            </div>
            <p className="mt-4 text-sm font-semibold text-[#2b2119]">{t.name}</p>
            <p className="text-xs font-medium text-[#b8521f]">{t.role}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5c5147]">{t.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
