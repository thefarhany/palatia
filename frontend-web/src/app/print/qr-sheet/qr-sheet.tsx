"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

// A4 grid (794×1123 @96dpi) of table QRs — one card per table, cut & stick.
export function QrSheet({ tables }: { tables: { id: number; label: string }[] }) {
  useEffect(() => {
    // Auto-print once images settle — the whole point of this page.
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <button
        onClick={() => window.print()}
        className="fixed bottom-6 right-6 z-10 flex items-center gap-2 rounded-lg bg-[#4f46e5] px-4 py-2.5 text-sm font-semibold text-white shadow-lg print:hidden"
      >
        <Printer className="size-4" />
        Print
      </button>
      <div className="mx-auto grid w-[794px] grid-cols-2 gap-4 p-2 print:w-[190mm] print:gap-2 print:p-0">
        {tables.map((t) => (
          <div
            key={t.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-[#e4e7ec] p-4 print:break-inside-avoid print:gap-1 print:rounded-md print:p-2"
          >
            <p className="font-brand text-lg font-semibold text-[#17181c]">{t.label}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/proxy/bo/tables/${t.id}/qr.png`}
              alt={`QR ${t.label}`}
              className="size-36 print:size-32"
            />
            <p className="text-xs text-[#667085]">Scan untuk memesan</p>
          </div>
        ))}
      </div>
    </>
  );
}