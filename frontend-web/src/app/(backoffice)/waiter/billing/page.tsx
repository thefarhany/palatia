import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { BillingClient } from "@/components/backoffice/waiter/billing-client";

export const metadata: Metadata = { title: "Billing" };

export default async function WaiterBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; table?: string }>;
}) {
  const { order, table } = await searchParams;

  return (
    <>
      <PageHeader title="Billing">
        <NotifButton />
      </PageHeader>
      <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <BillingClient orderParam={order} tableParam={table} />
      </main>
    </>
  );
}
