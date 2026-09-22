"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col bg-[#faf6f0] font-sans text-[#2b2119]">
      <main className="flex min-h-[80vh] flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-6">
          <div className="grid size-16 place-items-center rounded-2xl bg-[#fbeaea] text-[#c0392b]">
            <AlertTriangle className="size-8" />
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="font-brand text-2xl font-bold text-[#2b2119] md:text-3xl">
              Terjadi Kesalahan Sistem
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-[#5c5147]">
              {error.message || "Aplikasi mengalami kendala teknis sementara. Silakan muat ulang halaman ini."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex items-center gap-2 rounded-xl bg-[#b8521f] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#9c4519]"
            >
              <RefreshCw className="size-4" />
              Coba Lagi
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl border border-[#e4d9cc] bg-white px-6 py-3 text-sm font-semibold text-[#2b2119] shadow-sm transition-colors hover:bg-[#f7ece4]"
            >
              <Home className="size-4" />
              Ke Beranda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
