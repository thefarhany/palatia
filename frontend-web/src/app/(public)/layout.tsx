import { Suspense, type ReactNode } from "react";
import { StaffTopBanner } from "@/components/public/staff-top-banner";
import { HomeNavbar } from "@/components/public/home/navbar";
import { getSession } from "@/lib/auth-server";

/**
 * Public Surface Layout.
 * Renders a sticky top header container combining StaffTopBanner (when staff is logged in) and HomeNavbar.
 */
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await getSession();

  return (
    <>
      <div className="sticky top-0 z-50">
        <Suspense fallback={null}>
          <StaffTopBanner user={user} />
          <HomeNavbar initialUser={user} />
        </Suspense>
      </div>
      {children}
    </>
  );
}
