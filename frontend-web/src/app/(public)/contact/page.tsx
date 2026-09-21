import type { Metadata } from "next";
import { HomeFooter } from "@/components/public/home/footer";
import { ContactForm } from "@/components/public/contact/contact-form";
import { ContactInfo } from "@/components/public/contact/info";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-[#2b2119]">
      <main className="mx-auto min-h-[80vh] w-full max-w-6xl px-6 py-14">
        <h1 className="font-brand text-4xl font-semibold text-[#2b2119] md:text-5xl">Talk to us.</h1>
        <p className="mt-3 text-sm text-[#5c5147]">
          Feedback, large orders (catering), or partnerships — we reply within 24 hours.
        </p>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
          <ContactForm />
          <ContactInfo />
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
