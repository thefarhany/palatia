import { StaffShell } from "@/components/layout/staff-shell";
import type { ReactNode } from "react";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit Log" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <StaffShell allow="ADMIN" nav={nav}>{children}</StaffShell>;
}