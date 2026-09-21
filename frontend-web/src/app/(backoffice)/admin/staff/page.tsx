import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { StaffClient } from "@/components/backoffice/admin/staff/staff-client";

export const metadata: Metadata = { title: "Staff" };

export default function AdminStaffPage() {
  return (
    <>
      <PageHeader title="Staff Management">
        <NotifButton />
      </PageHeader>
      <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <StaffClient />
      </main>
    </>
  );
}
