"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { PanelLeftClose } from "lucide-react";
import { useSidebarStore } from "@/store/sidebar-store";
import { SidebarNav } from "./sidebar-nav";
import { LogoutButton } from "./logout-button";

/**
 * Collapsible dark sidebar: 240px (icon + label) ↔ 68px (icon only, centered),
 * spring-animated via motion. Tooltips show labels while collapsed.
 */
export function CollapsibleSidebar({
  role,
  userName,
  nav,
  children,
}: {
  role: string;
  userName: string;
  nav: { href: string; label: string }[];
  children: ReactNode;
}) {
  const collapsed = useSidebarStore((st) => st.collapsed);
  const toggleCollapsed = useSidebarStore((st) => st.toggle);

  return (
    <div className="flex min-h-svh bg-[#f7f8fa] dark:bg-background">
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="sticky top-0 flex h-svh shrink-0 flex-col items-center gap-6 overflow-hidden bg-[#1a1d23] px-3 py-6"
      >
        {/* Brand: wordmark ↔ P tile, toggle stacked below when collapsed */}
        <div
          className={`w-full items-center ${collapsed ? "flex flex-col gap-3" : "flex justify-between"}`}
        >
          {collapsed ? (
            <>
              <span className="grid size-9 place-items-center rounded-lg bg-[#4f46e5] font-brand text-lg font-semibold text-white">
                P
              </span>
              <button
                onClick={toggleCollapsed}
                aria-label="Tampilkan sidebar"
                className="rounded-md p-1.5 text-[#b3bac7] transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <PanelLeftClose className="size-4 rotate-180 transition-transform duration-300" />
              </button>
            </>
          ) : (
            <>
              <p className="pl-1 font-brand text-[22px] font-semibold text-white [font-variation-settings:'SOFT'_0,'WONK'_1]">
                Palatia
              </p>
              <button
                onClick={toggleCollapsed}
                aria-label="Sembunyikan sidebar"
                className="rounded-md p-1.5 text-[#b3bac7] transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </>
          )}
        </div>

        <div className="w-full">
          <SidebarNav items={nav} collapsed={collapsed} />
        </div>

        <div className="flex-1" />

        {/* User: card ↔ avatar */}
        {collapsed ? (
          <span
            title={`${userName} · ${role}`}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[#4f46e5] text-xs font-semibold text-white"
          >
            {userName.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <div className="flex w-full items-center gap-2.5 rounded-lg bg-white/[0.08] py-3 pl-3 pr-1.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#4f46e5] text-xs font-semibold text-white">
              {userName.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{userName}</p>
              <p className="text-[11px] font-medium text-[#b3bac7]">{role}</p>
            </div>
            <LogoutButton className="bg-white text-[#1a1d23] hover:bg-white/90 hover:text-[#1a1d23]" />
          </div>
        )}
      </motion.aside>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}