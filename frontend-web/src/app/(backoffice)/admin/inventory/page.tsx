import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { InventoryClient } from "@/components/backoffice/admin/inventory/inventory-client";

export const metadata: Metadata = { title: "Inventory" };

export default function AdminInventoryPage() {
  return (
    <>
      <PageHeader title="Inventory">
        <NotifButton />
      </PageHeader>
      <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <InventoryClient />
      </main>
    </>
  );
}
