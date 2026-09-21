import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { AuditClient } from "@/components/backoffice/admin/audit-client";

export const metadata: Metadata = { title: "Audit Log" };

export default function AdminAuditPage() {
  return (
    <>
      <PageHeader title="Audit Log">
        <NotifButton />
      </PageHeader>
      <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <AuditClient />
      </main>
    </>
  );
}
