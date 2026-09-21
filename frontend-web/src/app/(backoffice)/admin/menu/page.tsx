import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { MenuClient } from "@/components/backoffice/admin/menu/menu-client";

export const metadata: Metadata = { title: "Menu" };

export default function AdminMenuPage() {
  return (
    <>
      <PageHeader title="Menu Management">
        <NotifButton />
      </PageHeader>
      <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <MenuClient />
      </main>
    </>
  );
}
