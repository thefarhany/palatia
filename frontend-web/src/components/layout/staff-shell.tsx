import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { getSession, TOKEN_COOKIE, ROLE_HOME } from "@/lib/auth-server";
import { SocketProvider } from "@/components/providers/socket-provider";
import { NotifButton } from "./notif-button";
import type { NavItem } from "@/lib/types";
import { CollapsibleSidebar } from "./sidebar-shell";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrator",
  CHEF: "Chef",
  WAITER: "Waiter",
};

/**
 * Shared staff chrome per Figma (6:33): dark sidebar (collapsible, icon mode)
 * + white topbar. Role gate is server-verified via /auth/me.
 */
export async function StaffShell({
  allow,
  nav,
  children,
}: {
  allow: string;
  nav: NavItem[];
  children: ReactNode;
}) {
  const user = await getSession();
  if (!user) redirect("/login/staff");
  if (user.role !== allow) redirect(ROLE_HOME[user.role] ?? "/login/staff");

  const token = (await cookies()).get(TOKEN_COOKIE)?.value ?? "";

  if (nav.length === 0) {
    return <SocketProvider token={token}>{children}</SocketProvider>;
  }

  return (
    <SocketProvider token={token}>
      <CollapsibleSidebar
        role={ROLE_LABEL[allow] ?? allow}
        userName={user.name}
        nav={nav}
      >
        {children}
      </CollapsibleSidebar>
    </SocketProvider>
  );
}

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-[#e4e7ec] bg-white px-8 dark:border-border dark:bg-card">
      <h1 className="text-lg font-semibold tracking-tight text-[#17181c] dark:text-foreground">
        {title}
      </h1>
      <div className="flex items-center gap-3">{children}</div>
    </header>
  );
}

export { NotifButton };
