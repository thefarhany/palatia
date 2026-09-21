import env from "./env.js";

export function computeTotals(subtotal: number, discount = 0) {
  const tax = round2((subtotal - discount) * (env.TAX_PERCENT / 100));
  const serviceCharge = round2((subtotal - discount) * (env.SERVICE_PERCENT / 100));
  const total = round2(subtotal - discount + tax + serviceCharge);
  return { discount, tax, serviceCharge, total };
}

export const RESTAURANT = {
  name: "Palatia Restaurant",
  address: "Jl. Contoh No. 1, Jakarta",
  phone: "+62 21 555 0000",
} as const;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}