import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession, ROLE_HOME } from "@/lib/auth-server";

export const metadata: Metadata = { title: "Kitchen & Chef Recipes - Palatia" };

export default async function KitchenLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login/staff");
  if (user.role !== "CHEF") redirect(ROLE_HOME[user.role] ?? "/login/staff");

  return children;
}
