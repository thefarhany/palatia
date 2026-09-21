import { StaffShell } from "@/components/layout/staff-shell";
import type { ReactNode } from "react";

const nav = [
  { href: "/waiter/orders", label: "Orders" },
  { href: "/waiter/reservations", label: "Reservations" },
  { href: "/waiter/billing", label: "Billing" },
];

export default function WaiterLayout({ children }: { children: ReactNode }) {
  return <StaffShell allow="WAITER" nav={nav}>{children}</StaffShell>;
}