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

interface HomeNavbarProps {
  initialUser?: User | null;
}

export function HomeNavbar({ initialUser = null }: HomeNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQrMenu, setIsQrMenu] = useState(false);

  // Sync state with initialUser prop when server re-renders
  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // Check if current page is QR menu (?t=...) safely in client
  useEffect(() => {
    if (pathname === "/menu" && typeof window !== "undefined") {
      setIsQrMenu(window.location.search.includes("t="));
    } else {
      setIsQrMenu(false);
    }
  }, [pathname]);

  // Always fetch fresh user profile on client mount or route change
  useEffect(() => {
    meService.profile().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Hide Navbar on auth pages (/login, /register), QR menu page (/menu?t=...), payment success page, and track page
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/payment/success") ||
    pathname.startsWith("/track") ||
    isQrMenu
  ) {
    return null;
  }

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

        {/* Desktop Links */}
        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`font-medium transition-colors ${
                  active ? "text-[#b8521f]" : "text-[#5c5147] hover:text-[#2b2119]"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA / Profile */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/reservasi"
            className="rounded-lg bg-[#b8521f] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519]"
          >
            Reserve a Table
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg bg-[#f1ead9] px-4 py-2 text-sm font-semibold text-[#2b2119] transition-colors hover:bg-[#e9dfca]">
                  <UserRound className="size-4 text-[#b8521f]" />
                  <span>{user.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                    <UserRound className="size-4" />
                    <span>Account Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={doLogout} className="flex items-center gap-2 text-red-600 cursor-pointer">
                  <LogOut className="size-4" />
                  <span>Logout</span>
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
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle Navigation"
            className="rounded-lg p-2 text-[#2b2119] hover:bg-[#f7ece4]"
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#f0e8de] bg-white px-6 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`text-base font-medium py-1 transition-colors ${
                    active ? "text-[#b8521f]" : "text-[#5c5147] hover:text-[#2b2119]"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-[#f0e8de]">
            <Link
              href="/reservasi"
              className="w-full text-center rounded-lg bg-[#b8521f] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#9c4519]"
            >
              Reserve a Table
            </Link>
            {user ? (
              <>
                <Link
                  href="/account"
                  className="w-full text-center rounded-lg bg-[#f1ead9] px-4 py-2.5 text-sm font-semibold text-[#2b2119] transition-colors hover:bg-[#e9dfca]"
                >
                  Account Profile ({user.name})
                </Link>
                <button
                  onClick={doLogout}
                  className="w-full text-center rounded-lg bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="w-full text-center rounded-lg bg-[#f1ead9] px-4 py-2.5 text-sm font-semibold text-[#2b2119] transition-colors hover:bg-[#e9dfca]"
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