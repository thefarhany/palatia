export interface Table {
  id: number;
  number: number;
  capacity: number;
  status: "FREE" | "OCCUPIED" | "RESERVED" | "OUT_OF_SERVICE";
  qrToken: string | null;
}

export interface TableForm {
  number: number;
  capacity: number;
}

export type TableRow = Table;

export interface Reservation {
  id: number;
  date: string;
  slot: string;
  guests: number;
  status: string;
  tableId: number | null;
  name?: string | null;
  phone?: string | null;
  user?: { id: number; name: string } | null;
  table: { number: number } | null;
}

export type ReservationsFilter = "hari" | "besok" | "minggu";
