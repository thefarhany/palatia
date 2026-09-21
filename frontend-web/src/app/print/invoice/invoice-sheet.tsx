"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

// Items block + auto print trigger. Separate client file so the page stays RSC.
export function InvoiceSheet({
  items,
}: {
  items: { qty: number; name: string; unitPrice: number; notes: string | null }[];
}) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
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
      <div className="mt-3 divide-y divide-dashed divide-[#e4e7ec] border-y border-dashed border-[#e4e7ec] py-1">
        {items.map((item, i) => (
          <div key={i} className="py-2">
            <div className="flex justify-between text-sm">
              <p className="text-[#17181c]">
                {item.qty}× {item.name}
              </p>
              <p className="text-[#17181c]">
                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(
                  item.unitPrice * item.qty,
                )}
              </p>
            </div>
            {item.notes && <p className="pl-6 text-xs text-[#667085]">{item.notes}</p>}
          </div>
        ))}
      </div>
    </>
  );
}