import type { Metadata } from "next";
import { PageHeader, NotifButton } from "@/components/layout/staff-shell";
import { ReservationsClient } from "@/components/backoffice/waiter/reservations-client";

export const metadata: Metadata = { title: "Reservations" };

export default function WaiterReservationsPage() {
  return (
    <>
      <PageHeader title="Reservations">
        <NotifButton />
      </PageHeader>
      <main className="flex flex-col gap-6 px-8 pb-8 pt-6">
        <ReservationsClient />
      </main>
    </>
  );
}
