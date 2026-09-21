import type { Metadata } from "next";
import { HomeFooter } from "@/components/public/home/footer";
import { MenuGrid } from "@/components/public/menu/menu-grid";
import { MenuCtaBanner } from "@/components/public/menu/cta-banner";
import { QrMenu } from "@/components/public/menu/qr-menu";

export const metadata: Metadata = { title: "Menu" };

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;

  // Scan QR → /menu?t=<token>: tampilan guest + keranjang, tanpa nav publik.
  if (t) return <QrMenu token={t} />;

  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-[#2b2119]">
      <main className="mx-auto min-h-[80vh] w-full max-w-6xl px-6 py-14">
        <h1 className="font-brand text-4xl font-semibold text-[#2b2119] md:text-5xl">Our menu.</h1>
        <p className="mt-3 text-sm text-[#5c5147]">
          Updated live from our system — stock &amp; prices are always accurate.
        </p>
        <MenuGrid />
        <div className="mt-14">
          <MenuCtaBanner />
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
