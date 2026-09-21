"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { menuService } from "@/services/menu-service";
import type { MenuItem } from "@/lib/types";
import { rp } from "@/lib/format";

const RUST = "bg-[#b8521f] hover:bg-[#9c4519]";
const BADGES = ["BEST SELLER", "FAVORITE", "SIGNATURE"];

export function HomeFeaturedMenu() {
  const [featured, setFeatured] = useState<MenuItem[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    void menuService.publicList().then((items) => setFeatured(items.filter((i) => i.available).slice(0, 3)))
      .catch(() => setLoadError(true));
  }, []);

  return (
    <section id="menu" className="bg-[#f2ede3] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-xs font-semibold tracking-[2px] text-[#b8521f]">MOST LOVED</p>
        <div className="mt-3 flex items-end justify-between">
          <h2 className="font-brand text-3xl font-semibold text-[#2b2119] md:text-4xl">The crowd favorites.</h2>
          <Link href="/menu" className="text-sm font-semibold text-[#b8521f] hover:underline">
            View all menus
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {featured.length === 0 && <p className="text-sm text-[#5c5147]">Menu coming soon.</p>}
          {featured.map((item, i) => (
            <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#f0e8de] bg-white">
              <div className="relative h-48 shrink-0 overflow-hidden bg-[#f7ece4]">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <p className="text-[10px] font-semibold tracking-[2px] text-[#b8521f]">{BADGES[i] ?? "MENU"}</p>
                  <p className="mt-2 text-sm font-semibold text-[#2b2119] line-clamp-1">{item.name}</p>
                  <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-[#5c5147]">
                    {item.description ?? "Home-style cooking, Palatia's way."}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-brand text-lg font-semibold text-[#2b2119]">{rp.format(Number(item.price))}</p>
                  <Link href="/menu" className={`rounded-lg ${RUST} px-3 py-1.5 text-xs font-semibold text-white`}>
                    + Order
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
