"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Utensils } from "lucide-react";
import { LogoutButton } from "@/components/layout/logout-button";

function Clock() {
  const [now, setNow] = useState(() =>
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const t = setInterval(
      () => setNow(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })),
      10_000,
    );
    return () => clearInterval(t);
  }, []);
  return <span suppressHydrationWarning>{now}</span>;
}

export function ChefHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/kitchen", label: "Kitchen Display", icon: Utensils },
    { href: "/kitchen/recipe", label: "Recipe", icon: BookOpen },
  ];

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 bg-[#1a1d23] px-6 py-3.5 sm:px-8">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <p className="font-brand text-2xl font-semibold text-white [font-variation-settings:'SOFT'_0,'WONK'_1]">
            Palatia
          </p>
          <span className="rounded bg-[#4f46e5]/20 px-2 py-0.5 text-[10px] font-bold tracking-[2px] text-[#818cf8]">
            CHEF
          </span>
        </div>

        {/* Navbar Items for Chef */}
        <nav className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] p-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/kitchen"
                ? pathname === "/kitchen"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#4f46e5] text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <p className="text-lg font-semibold text-white">
          <Clock />
        </p>
        <span className="flex items-center gap-1.5 rounded-full bg-white/[0.12] px-2.5 py-1 text-[11px] font-semibold tracking-[1px] text-white">
          <span className="size-2 rounded-full bg-[#12b76a]" />
          LIVE
        </span>
        <LogoutButton className="text-white/70 hover:bg-white/10 hover:text-white" />
      </div>
    </header>
  );
}
