"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserRound, Menu, X } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { meService, logout } from "@/services/me-service";
import type { User } from "@/lib/types";

export const RUST = "bg-[#b8521f] hover:bg-[#9c4519]";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/menu", label: "Menu" },
  { href: "/contact", label: "Contact" },
];

export function HomeNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hide Navbar on customer/staff login and register pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return null;
  }

  // Fetch user profile on mount if token cookie exists
  useEffect(() => {
    if (typeof document !== "undefined" && document.cookie.split(";").some((c) => c.trim().startsWith("token="))) {
      meService.profile().then(setUser).catch(() => setUser(null));
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const doLogout = async () => {
    await logout();
    setUser(null);
    toast.success("Logged out");
    router.refresh();
  };

  return (
    <header className="border-b border-[#f0e8de] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-brand text-2xl font-semibold text-[#2b2119]">
          Palatia
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV.map((n) => {
            const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={
                  active ? "font-medium text-[#b8521f]" : "text-[#5c5147] hover:text-[#b8521f]"
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/reservasi"
            className={`rounded-lg ${RUST} px-4 py-2 text-sm font-semibold text-white transition-colors`}
          >
            Reserve a Table
          </Link>
          {user && user.role === "CUSTOMER" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Account menu" className="rounded-full transition-opacity hover:opacity-80">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" className="size-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-9 place-items-center rounded-full bg-[#b8521f] text-sm font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem asChild>
                  <Link href="/account?tab=profile" className="flex items-center gap-2">
                    <UserRound className="size-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={doLogout}
                  className="flex items-center gap-2 text-[#c0392b] focus:text-[#c0392b]"
                >
                  <LogOut className="size-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-[#f1ead9] px-4 py-2 text-sm font-semibold text-[#2b2119] transition-colors hover:bg-[#e9dfca]"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-lg p-2 text-[#2b2119] hover:bg-[#f7ece4] focus:outline-none"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-[#f0e8de] bg-white px-6 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4 text-base">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={
                    active
                      ? "font-semibold text-[#b8521f]"
                      : "text-[#5c5147] hover:text-[#b8521f]"
                  }
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 flex flex-col gap-3 border-t border-[#f0e8de] pt-4">
            <Link
              href="/reservasi"
              className={`w-full rounded-lg ${RUST} py-2.5 text-center text-sm font-semibold text-white transition-colors`}
            >
              Reserve a Table
            </Link>
            {user && user.role === "CUSTOMER" ? (
              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/account?tab=profile"
                  className="flex items-center gap-2 text-sm font-medium text-[#2b2119]"
                >
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt="" className="size-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-[#b8521f] text-xs font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  Profile ({user.name})
                </Link>
                <button
                  onClick={doLogout}
                  className="flex items-center gap-1 text-xs font-semibold text-[#c0392b]"
                >
                  <LogOut className="size-4" /> Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full rounded-lg bg-[#f1ead9] py-2.5 text-center text-sm font-semibold text-[#2b2119] transition-colors hover:bg-[#e9dfca]"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}