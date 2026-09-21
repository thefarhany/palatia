import Link from "next/link";

export function MenuCtaBanner() {
  return (
    <div className="rounded-3xl bg-[#2b2119] px-8 py-10 md:px-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="font-brand text-3xl font-semibold text-white">Ordering from your table?</h2>
          <p className="mt-2 text-sm text-white/70">
            Walk in, sit down, scan the QR — order &amp; pay from your phone. Or reserve first to get a table.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/reservasi"
            className="rounded-lg bg-[#b8521f] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519]"
          >
            Reserve a Table
          </Link>
          <Link
            href="/contact"
            className="rounded-lg bg-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
          >
            Hours &amp; Location
          </Link>
        </div>
      </div>
    </div>
  );
}
