import Link from "next/link";
import { Home, Utensils } from "lucide-react";
import { HomeNavbar } from "@/components/public/home/navbar";
import { HomeFooter } from "@/components/public/home/footer";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col bg-[#faf6f0] font-sans text-[#2b2119]">
      {/* Customer Header */}
      <HomeNavbar />

      {/* Main Content Area with min-h-[80vh] and no card box */}
      <main className="flex min-h-[80vh] flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6">
          
          {/* 404 Headline */}
          <div className="flex flex-col items-center gap-3">
            <span className="font-brand text-7xl font-extrabold text-[#b8521f] md:text-8xl">
              404
            </span>
            <h1 className="font-brand text-2xl font-bold text-[#2b2119] md:text-3xl">
              Oops! Menu Ini Belum Tersedia di Meja
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-[#5c5147]">
              Halaman yang kamu cari sepertinya sudah habis, dipindahkan, atau kamu salah mengetikkan alamat URL.
            </p>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl bg-[#2b2119] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1a130e]"
            >
              <Home className="size-4" />
              Kembali ke Beranda
            </Link>

            <Link
              href="/menu"
              className="flex items-center gap-2 rounded-xl bg-[#b8521f] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#9c4519]"
            >
              <Utensils className="size-4" />
              Jelajahi Menu Utama
            </Link>
          </div>

        </div>
      </main>

      {/* Customer Footer */}
      <HomeFooter />
    </div>
  );
}
