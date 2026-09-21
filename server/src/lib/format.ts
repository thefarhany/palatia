
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
