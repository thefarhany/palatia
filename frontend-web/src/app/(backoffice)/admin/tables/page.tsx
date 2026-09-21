import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { TablesClient } from "@/components/backoffice/admin/tables/tables-client";

export const metadata: Metadata = { title: "Tables" };

export default function AdminTablesPage() {
  return (
    <>
      <PageHeader title="Tables">
        <NotifButton />
      </PageHeader>
      <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <TablesClient />
      </main>
    </>
  );
}
