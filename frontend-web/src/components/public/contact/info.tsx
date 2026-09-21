export function ContactInfo() {
  return (
    <div className="grid gap-5">
      {/* Peta */}
      <div className="grid h-56 place-items-center rounded-2xl bg-[#f2ede3]">
        <span className="text-sm text-[#5c5147]">Map — Jl. Melati No. 12, Bandung</span>
      </div>

      {/* Jam operasional */}
      <div className="rounded-2xl border border-[#f0e8de] bg-white p-6">
        <p className="text-xs font-semibold tracking-[2px] text-[#b8521f]">OPENING HOURS</p>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[#2b2119]">Mon–Fri</p>
            <p className="text-[#5c5147]">10.00 – 22.00</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-[#2b2119]">Sat–Sun</p>
            <p className="text-[#5c5147]">09.00 – 23.00</p>
          </div>
        </div>
      </div>

      {/* Kontak cepat */}
      <div className="rounded-2xl bg-[#2b2119] p-6 text-white">
        <p className="font-brand text-xl font-semibold">Need a quick answer?</p>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold">WhatsApp</p>
            <a href="https://wa.me/6281234567890" className="text-white/80 hover:text-white">
              +62 812-3456-7890
            </a>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-semibold">Email</p>
            <a href="mailto:halo@palatia.id" className="text-white/70 hover:text-white">
              halo@palatia.id
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
