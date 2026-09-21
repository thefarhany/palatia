/** Shared display formatters — safe for client and server. */
export const tableLabel = (n: number) => `T-${String(n).padStart(2, "0")}`;

export const rp = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Status badge colors (order + table + reservation families share tokens). */
export const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  // orders
  PENDING: { label: "Pending", cls: "bg-[#b54708]" },
  PREPARING: { label: "Preparing", cls: "bg-[#2563eb]" },
  READY: { label: "Ready", cls: "bg-[#067647]" },
  SERVED: { label: "Disajikan", cls: "bg-[#7c3aed]" },
  COMPLETED: { label: "Completed", cls: "bg-[#667085]" },
  CANCELLED: { label: "Cancelled", cls: "bg-[#d92d20]" },
  // tables (label-only overrides; colors reused where identical)
  FREE: { label: "Free", cls: "bg-[#667085]" },
  OCCUPIED: { label: "Occupied", cls: "bg-[#2563eb]" },
  RESERVED: { label: "Reserved", cls: "bg-[#067647]" },
  OUT_OF_SERVICE: { label: "Out of Service", cls: "bg-[#d92d20]" },
  // reservations
  CONFIRMED: { label: "Confirmed", cls: "bg-[#2563eb]" },
  SEATED: { label: "Seated", cls: "bg-[#067647]" },
};

export const PAID_BADGE = (status: string) =>
  status === "PAID" ? "bg-[#067647]" : "bg-[#b54708]";
/**
 * Satuan dasar utk input resep: bahan ber-satuan besar (kg/L/botol) diinput
 * dalam g/ml. Faktor = base × factor = satuan bahan.
 * ponytail: botol diasumsikan 1000 ml — ganti ke tabel konversi nyata kalau ada.
 */
const BASE_UNIT: Record<string, { base: string; factor: number }> = {
  kg: { base: "g", factor: 1000 },
  L: { base: "ml", factor: 1000 },
  botol: { base: "ml", factor: 1000 },
  g: { base: "g", factor: 1 },
  ml: { base: "ml", factor: 1 },
  pcs: { base: "pcs", factor: 1 },
};

export const toBaseUnit = (unit: string) =>
  BASE_UNIT[unit] ?? { base: unit, factor: 1 };
