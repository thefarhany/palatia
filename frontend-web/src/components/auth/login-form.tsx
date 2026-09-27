"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { login } from "@/services/auth-service";
import { AuthSurfaceWarning } from "@/components/auth/auth-surface-warning";
import { toast } from "sonner";
import { ROLE_HOME } from "@/lib/roles";
import type { LoginForm as LoginFormValues } from "@/lib/types";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const COPY = {
  staff: {
    caption: "Staff & admin login here · customers order via app",
    roles: ["Admin", "Chef", "Waiter"],
  },
  customer: {
    caption: "Sign in to order and track your orders",
    roles: [],
  },
} as const;

export default function LoginForm({
  variant,
}: {
  variant: "staff" | "customer";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [warningBanner, setWarningBanner] = useState<{
    message: string;
    targetUrl: string;
    targetLabel: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setWarningBanner(null);
    const surface = variant === "staff" ? "staff" : "public";
    const user = await login(data.email, data.password, surface).catch(
      (e: Error) => {
        const msg = e.message || "Login failed";
        toast.error(msg);
        if (msg.toLowerCase().includes("terdeteksi") || msg.toLowerCase().includes("portal")) {
          setWarningBanner({
            message: msg,
            targetUrl: variant === "staff" ? "/login" : "/login/staff",
            targetLabel:
              variant === "staff" ? "Customer Portal" : "Staff Portal",
          });
        }
        return null;
      },
    );
    if (!user) return;
    toast.success("Login successful — welcome back!");
    const next = params.get("next");
    const role = user.role as keyof typeof ROLE_HOME | undefined;
    const target = next ?? (role ? ROLE_HOME[role] : "/");
    window.location.href = target;
  };

  return (
    <div className="grid min-h-svh place-items-center bg-[#f7f8fa] p-4 dark:bg-background">
      <div className="w-full max-w-[440px] rounded-2xl border border-[#e4e7ec] bg-white p-10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:border-border dark:bg-card">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-5"
          noValidate
        >
          {/* Logo */}
          <div className="grid gap-1.5 text-center">
            <p className="font-brand text-4xl font-semibold tracking-tight text-[#17181c] dark:text-foreground [font-variation-settings:'SOFT'_0,'WONK'_1]">
              Palatia
            </p>
            <p className="text-[13px] text-[#667085] dark:text-muted-foreground">
              Restaurant Management System
            </p>
          </div>

          {/* Fields */}
          <div className="grid gap-3.5">
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email" className="text-sm font-medium">
                Email
              </FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="name@palatia.id"
                autoComplete="email"
                className="h-10 rounded-lg"
                {...register("email")}
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password" className="text-sm font-medium">
                Password
              </FieldLabel>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-10 rounded-lg pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute inset-y-0 right-3 grid place-items-center text-[#667085] transition-colors hover:text-[#17181c] dark:text-muted-foreground dark:hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <FieldError>{errors.password.message}</FieldError>
              )}
            </Field>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 rounded-[10px]"
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Sign In
          </Button>

          <p className="text-center text-xs text-[#667085] dark:text-muted-foreground">
            {COPY[variant].caption}
          </p>

          {variant === "staff" && (
            <div className="rounded-xl border border-[#e4d9cc] bg-[#fdfbf7] p-3 dark:border-border dark:bg-card/50">
              <div className="flex items-center justify-between pb-2 border-b border-[#f0e8de] dark:border-border">
                <span className="text-[11px] font-bold text-[#b8521f] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#b8521f]" /> Quick Demo Accounts
                </span>
                <span className="text-[10px] text-[#667085]">Password: password123</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-2">
                {[
                  { label: "Admin", email: "admin@palatia.id" },
                  { label: "Chef", email: "chef@palatia.id" },
                  { label: "Waiter", email: "waiter@palatia.id" },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setValue("email", item.email, { shouldValidate: true });
                      setValue("password", "password123", { shouldValidate: true });
                      toast.info(`Auto-filled ${item.label} credentials!`);
                    }}
                    className="flex flex-col items-center rounded-lg border border-[#e4d9cc] bg-white p-1.5 text-center transition-all hover:border-[#b8521f] hover:bg-[#f7ece4]/50 active:scale-95 shadow-2xs cursor-pointer"
                  >
                    <span className="text-xs font-bold text-[#2b2119]">{item.label}</span>
                    <span className="text-[9px] text-[#667085] truncate max-w-full">{item.email.split("@")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {warningBanner && <AuthSurfaceWarning {...warningBanner} />}
        </form>
      </div>
    </div>
  );
}
