import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, getSession, TOKEN_COOKIE } from "@/lib/auth-server";
import { tableLabel } from "@/lib/format";
import { rp } from "@/lib/format";
import { InvoiceSheet } from "./invoice-sheet";

// Print-friendly invoice (UC-20) — window.print() is the whole PDF story (docs: no pdf lib).
export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { order: orderParam } = await searchParams;
  const id = Number(orderParam);
  if (!id) redirect("/waiter/billing");

  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const invoice = await apiFetch<{
    invoice: {
      number: string;
      issuedAt: string;
      status: string;
      paymentStatus: string;
      paymentMethod: string | null;
      tableNumber: number | null;
      servedBy: string | null;
      items: { qty: number; name: string; unitPrice: number; notes: string | null }[];
      subtotal: number;
      discount: number;
      tax: number;
      serviceCharge: number;
      total: number;
    };
  }>(`/me/orders/${id}/invoice`, { token })
    .then((r) => r.invoice)
    .catch(() => null);
  if (!invoice) redirect("/waiter/billing");

  return (
    <div className="min-h-svh bg-white p-8 print:p-0">
      <div className="mx-auto max-w-md">
        <div className="mb-4 text-center">
          <p className="font-brand text-2xl font-semibold text-[#17181c]">Palatia</p>
          <p className="text-xs text-[#667085]">Restaurant Management System</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-[#17181c]">{invoice.number}</p>
          <p className="text-[#667085]">
            {invoice.tableNumber ? tableLabel(invoice.tableNumber) + " · " : ""}
            {new Date(invoice.issuedAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
          </p>
        </div>
        {invoice.servedBy && <p className="mt-0.5 text-right text-xs text-[#667085]">Waiter: {invoice.servedBy}</p>}
        <InvoiceSheet items={invoice.items} />
        <div className="mt-3 grid gap-1 text-sm">
          <div className="flex justify-between">
            <p className="text-[#667085]">Subtotal</p>
            <p className="text-[#17181c]">{rp.format(invoice.subtotal)}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#667085]">PPN (GST) 10%</p>
            <p className="text-[#17181c]">{rp.format(invoice.tax)}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[#667085]">Service charge 5%</p>
            <p className="text-[#17181c]">{rp.format(invoice.serviceCharge)}</p>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between">
              <p className="text-[#667085]">Diskon</p>
              <p className="text-[#067647]">−{rp.format(invoice.discount)}</p>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-[#17181c] pt-2 text-base font-bold text-[#17181c]">
            <p>TOTAL</p>
            <p>{rp.format(invoice.total)}</p>
          </div>
          <p className="mt-2 text-center text-xs text-[#667085]">
            {invoice.paymentStatus === "PAID"
              ? `LUNAS · ${invoice.paymentMethod === "CASH" ? "Tunai" : "Kartu"}`
              : "BELUM DIBAYAR"}
          </p>
          <p className="mt-4 text-center text-xs text-[#667085]">Terima kasih — selamat menikmati!</p>
        </div>
      </div>
    </div>
  );
}