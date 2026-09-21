import type { Metadata } from "next";
import { HomeHero } from "@/components/public/home/hero";
import { HomeAbout } from "@/components/public/home/about";
import { HomeFeatures } from "@/components/public/home/features";
import { HomeFeaturedMenu } from "@/components/public/home/featured-menu";
import { HomeGallery } from "@/components/public/home/gallery";
import { HomeTestimonials } from "@/components/public/home/testimonials";
import { HomeFooter } from "@/components/public/home/footer";

export const metadata: Metadata = { title: "Family Restaurant · Since 2016" };

export default async function PublicHomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-[#2b2119]">
      <HomeHero />
      <HomeAbout />
      <HomeFeatures />
      <HomeFeaturedMenu />
      <HomeGallery />
      <HomeTestimonials />
      <HomeFooter />
    </div>
  );
}
