import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiFetch, getSession, TOKEN_COOKIE } from "@/lib/auth-server";
import { QrSheet } from "./qr-sheet";
import { tableLabel } from "@/lib/format";

// Admin-only print sheet (Figma 15:1105): A4 grid of table QRs, print via Ctrl+P.
export const metadata: Metadata = { title: "Print QR" };

export default async function QrSheetPage() {
  const user = await getSession();
  if (!user || user.role !== "ADMIN") redirect("/login");
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const { tables } = await apiFetch<{ tables: { id: number; number: number }[] }>("/bo/tables", { token });

  return (
    <div className="min-h-svh bg-white p-8 print:p-0">
      <div className="mx-auto mb-6 flex max-w-[794px] items-center justify-between print:hidden">
        <p className="text-sm text-[#667085]">
          {tables.length} QR siap print — potong per meja.
        </p>
        <div className="flex gap-2">
          <Link
            href="/admin/tables"
            className="rounded-lg border border-[#d0d5dd] px-4 py-2 text-sm font-medium"
          >
            Kembali
          </Link>
        </div>
      </div>
      <QrSheet tables={tables.map((t) => ({ id: t.id, label: tableLabel(t.number) }))} />
    </div>
  );
}