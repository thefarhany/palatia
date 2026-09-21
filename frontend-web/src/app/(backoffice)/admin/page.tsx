import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { DashboardClient } from "@/components/backoffice/admin/dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboard() {
  return (
    <>
      <PageHeader title="Dashboard">
        <NotifButton />
      </PageHeader>
      <DashboardClient />
    </>
  );
}
