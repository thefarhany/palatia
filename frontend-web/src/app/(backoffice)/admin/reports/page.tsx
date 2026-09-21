import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { ReportsClient } from "@/components/backoffice/admin/reports-client";

export const metadata: Metadata = { title: "Reports" };

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader title="Reports">
        <NotifButton />
      </PageHeader>
      <ReportsClient />
    </>
  );
}
