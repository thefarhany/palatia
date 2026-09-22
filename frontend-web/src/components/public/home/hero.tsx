import Image from "next/image";
import Link from "next/link";
import { RUST } from "./navbar";

export function HomeHero() {
  return (
    <section className="mx-auto w-full grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-16 md:grid-cols-2 md:py-20">
      <div className="flex flex-col items-start justify-start text-left">
        <p className="text-[11px] sm:text-xs font-semibold tracking-[2px] text-[#b8521f]">
          FAMILY RESTAURANT · SINCE 2016
        </p>
        <h1 className="mt-3 font-brand text-3xl sm:text-5xl md:text-6xl font-semibold leading-[1.15] text-[#2b2119]">
          Home-cooked taste,
          <br className="hidden sm:inline" />
          {" "}bistro soul.
        </h1>
        <p className="mt-3.5 max-w-md text-sm sm:text-[15px] leading-relaxed text-[#5c5147]">
          Fresh market ingredients, cooked daily. Order from your table via QR,
          watch your dish live.
        </p>
        <div className="mt-6 flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-start gap-3 text-left">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center rounded-xl bg-[#b8521f] px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#9c4519] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            View Menu
          </Link>
          <Link
            href="/reservasi"
            className="inline-flex items-center justify-center rounded-xl border border-[#e4d9cc] bg-white px-6 py-3 text-sm font-semibold text-[#2b2119] shadow-sm transition-all duration-200 hover:border-[#b8521f] hover:text-[#b8521f] hover:bg-[#f7ece4]/60 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            Reserve a Table
          </Link>
        </div>
      </div>
      <div className="relative h-56 sm:h-72 overflow-hidden rounded-2xl bg-[#f7ece4] md:h-96">
        <Image
          src="https://images.unsplash.com/photo-1579027989536-b7b1f875659b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Suasana Restoran Palatia"
          fill
          className="object-cover"
          priority
        />
      </div>
    </section>
  );
}
