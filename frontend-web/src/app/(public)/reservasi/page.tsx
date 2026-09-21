import type { Metadata } from "next";
import { HomeFooter } from "@/components/public/home/footer";
import { ReservationForm } from "@/components/public/reservasi/reservation-form";

export const metadata: Metadata = { title: "Reserve a Table" };

export default function ReservasiPage() {
  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-[#2b2119]">
      <main className="mx-auto min-h-[80vh] w-full max-w-6xl px-6 py-14">
        <h1 className="font-brand text-4xl font-semibold text-[#2b2119] md:text-5xl">Lock in your table.</h1>
        <p className="mt-3 text-sm text-[#5c5147]">
          Pick a date &amp; slot — instant confirmation, no phone calls, no queue.
        </p>
        <div className="mt-10">
          <ReservationForm />
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
