import type { Metadata } from "next";
import { HomeFooter } from "@/components/public/home/footer";
import { AboutHero } from "@/components/public/about/hero";
import { AboutValues } from "@/components/public/about/values";
import { AboutTimeline } from "@/components/public/about/timeline";
import { AboutTeam } from "@/components/public/about/team";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-[#2b2119]">
      <AboutHero />
      <AboutValues />
      <AboutTimeline />
      <AboutTeam />
      <HomeFooter
        ctaTitle="Mau coba langsung?"
        ctaSubtitle="Reserve a table, or browse our signature menus."
        ctaLabel="View Menu"
      />
    </div>
  );
}
