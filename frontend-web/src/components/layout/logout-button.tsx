"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Logout"
      className={`text-sidebar-foreground/60 hover:text-sidebar-foreground ${className}`}
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        toast.success("Berhasil logout");
        router.replace("/login/staff");
      }}
    >
      <LogOut className="size-4" />
    </Button>
  );
}