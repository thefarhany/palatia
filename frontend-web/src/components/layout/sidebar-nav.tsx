"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Receipt,
  ScrollText,
  ShoppingBag,
  Table2,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

// Icon per nav item — resolved here so layouts (RSC) stay serializable.
const ICONS: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Menu: UtensilsCrossed,
  Tables: Table2,
  Inventory: Package,
  Staff: Users,
  Reports: BarChart3,
  "Audit Log": ScrollText,
  Floor: LayoutDashboard,
  Orders: ClipboardList,
  Reservations: CalendarDays,
  Billing: Receipt,
  "Pickup Display": ShoppingBag,
};

export function SidebarNav({
  items,
  collapsed,
}: {
  items: import("@/lib/types").NavItem[];
  collapsed: boolean;
}) {
  const pathname = usePathname();
  return (
    <nav className={`grid gap-1 ${collapsed ? "justify-items-center" : ""}`}>
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && item.href !== "/waiter" && pathname.startsWith(item.href));
        const Icon = ICONS[item.label] ?? ClipboardList;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
              collapsed ? "size-10 justify-center" : "px-3 py-2.5"
            } ${
              active
                ? "bg-[#4f46e5] text-white"
                : "text-[#b3bac7] hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && <span className="truncate pl-2.5">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}