import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { OrdersClient } from "@/components/backoffice/waiter/orders/orders-client";

export const metadata: Metadata = { title: "Orders" };

export default function WaiterOrdersPage() {
  return (
    <>
      <PageHeader title="Orders">
        <NotifButton />
      </PageHeader>
      <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <OrdersClient />
      </main>
    </>
  );
}
