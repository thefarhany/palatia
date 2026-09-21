import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession, ROLE_HOME } from "@/lib/auth-server";
import { AccountView } from "@/components/public/account/account-view";
import { HomeFooter } from "@/components/public/home/footer";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  // Account ini customer-facing — staff tetap di home role-nya.
  if (user.role !== "CUSTOMER") redirect(ROLE_HOME[user.role]);
  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-[#2b2119]">
      <AccountView user={user} />
      <HomeFooter />
    </div>
  );
}