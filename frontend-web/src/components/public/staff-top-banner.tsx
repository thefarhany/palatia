import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";
import { ROLE_HOME } from "@/lib/auth-server";
import type { User } from "@/lib/types";

export function StaffTopBanner({ user }: { user?: User | null }) {
  if (!user || user.role === "CUSTOMER") return null;

  const roleLabel =
    user.role === "WAITER"
      ? "Waiter"
      : user.role === "CHEF"
      ? "Chef"
      : user.role === "ADMIN"
      ? "Admin"
      : user.role;

  const dashboardUrl = ROLE_HOME[user.role] ?? "/login";

  return (
    <div className="bg-[#2b2119] px-6 py-2.5 text-white border-b border-black/20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-xs font-medium">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 shrink-0 text-[#d97706]" />
          <span>
            You are browsing the public page with a <strong>Staff Account ({roleLabel})</strong> — Read-Only Mode.
          </span>
        </div>
        <Link
          href={dashboardUrl}
          className="flex items-center gap-1 rounded-md bg-[#b8521f] px-3 py-1 font-semibold text-white transition-colors hover:bg-[#9c4519]"
        >
          Back to Staff Dashboard <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
