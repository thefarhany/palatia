"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, ArrowRight, Bell, CalendarDays, Loader2, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { login, register } from "@/services/auth-service";
import { AuthSurfaceWarning } from "@/components/auth/auth-surface-warning";
import { ROLE_HOME } from "@/lib/roles";

const PERKS = [
  { icon: Bell, text: "Live notifications — dish status sent straight to your phone" },
  { icon: ReceiptText, text: "Order history & visit points" },
  { icon: CalendarDays, text: "Easy table reservation without phone calls" },
];

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export function CustomerAuth() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [warningBanner, setWarningBanner] = useState<{
    message: string;
    targetUrl: string;
    targetLabel: string;
  } | null>(null);

  const afterAuth = (role: string, newAccount: boolean) => {
    toast.success(
      newAccount ? "Account created — welcome to Palatia!" : "Login successful — welcome back!",
    );
    const home = ROLE_HOME[role as keyof typeof ROLE_HOME];
    router.replace(home ?? "/menu");
  };

  const loginForm = useForm<LoginValues>({
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterValues>({
    defaultValues: { name: "", email: "", password: "" },
  });

  const onLogin = async (v: LoginValues) => {
    setWarningBanner(null);
    try {
      const user = await login(v.email, v.password, "public");
      afterAuth(user.role, false);
    } catch (e) {
      toast.error((e as Error).message);
      setWarningBanner({
        message: (e as Error).message,
        targetUrl: "/login/staff",
        targetLabel: "Portal Staff",
      });
    }
  };

  const onRegister = async (v: RegisterValues) => {
    try {
      const user = await register(v.name, v.email, v.password);
      afterAuth(user.role, true);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const err = (f: { errors: Record<string, { message?: string }> }, k: string) => f.errors[k]?.message;

  return (
    <div className="flex min-h-svh bg-white font-sans text-[#2b2119]">
      {/* Panel kiri — cerita value customer */}
      <aside className="relative hidden w-1/2 flex-col justify-between bg-[#2b2119] p-12 text-white lg:flex">
        <p className="font-brand text-3xl font-semibold">Palatia</p>

        <div className="max-w-lg">
          <h1 className="font-brand text-5xl font-semibold leading-tight">
            Order faster, track live in real time.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/70">
            Sign in for live notifications, order history, and instant table reservations.
          </p>
          <ul className="mt-10 grid gap-5">
            {PERKS.map((p) => (
              <li key={p.text} className="flex items-center gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
                  <p.icon className="size-5" />
                </span>
                <span className="text-sm">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-white/50">© 2026 Palatia</p>
      </aside>

      {/* Panel kanan — form */}
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl border border-[#f0e8de] bg-white p-6 shadow-[0_8px_24px_rgba(43,33,25,0.06)] sm:p-8">
          {/* Tab Login / Register */}
          <div className="grid grid-cols-2 rounded-xl bg-[#f1ead9] p-1">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  tab === t ? "bg-white text-[#2b2119] shadow-sm" : "text-[#5c5147] hover:text-[#2b2119]"
                }`}
              >
                {t === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="mt-6 grid gap-4" noValidate>
              <div>
                <h2 className="font-brand text-2xl font-semibold">Welcome back</h2>
                <p className="mt-1 text-sm text-[#5c5147]">
                  Sign in to order faster &amp; track live orders.
                </p>
              </div>
              <label className="grid gap-1.5 text-sm font-medium">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...loginForm.register("email")}
                  className="h-11 rounded-lg border border-[#e4d9cc] px-3 text-sm font-normal outline-none focus:border-[#b8521f]"
                />
                {err(loginForm.formState, "email") && (
                  <span className="text-xs font-normal text-[#c0392b]">{err(loginForm.formState, "email")}</span>
                )}
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...loginForm.register("password")}
                  className="h-11 rounded-lg border border-[#e4d9cc] px-3 text-sm font-normal outline-none focus:border-[#b8521f]"
                />
                {err(loginForm.formState, "password") && (
                  <span className="text-xs font-normal text-[#c0392b]">{err(loginForm.formState, "password")}</span>
                )}
              </label>
              <button
                type="button"
                onClick={() => toast.info("Contact the cashier for password reset — reset feature is not yet available.")}
                className="justify-self-start text-sm font-semibold text-[#b8521f] hover:underline"
              >
                Forgot password?
              </button>
              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b8521f] text-sm font-semibold text-white transition-colors hover:bg-[#9c4519] disabled:opacity-60"
              >
                {loginForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Login
              </button>

              {warningBanner && <AuthSurfaceWarning {...warningBanner} />}
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="mt-6 grid gap-4" noValidate>
              <div>
                <h2 className="font-brand text-2xl font-semibold">Create a new account</h2>
                <p className="mt-1 text-sm text-[#5c5147]">
                  Sign up for live notifications &amp; order history.
                </p>
              </div>
              <label className="grid gap-1.5 text-sm font-medium">
                Name
                <input
                  autoComplete="name"
                  placeholder="Your full name"
                  {...registerForm.register("name")}
                  className="h-11 rounded-lg border border-[#e4d9cc] px-3 text-sm font-normal outline-none focus:border-[#b8521f]"
                />
                {err(registerForm.formState, "name") && (
                  <span className="text-xs font-normal text-[#c0392b]">{err(registerForm.formState, "name")}</span>
                )}
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Email
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...registerForm.register("email")}
                  className="h-11 rounded-lg border border-[#e4d9cc] px-3 text-sm font-normal outline-none focus:border-[#b8521f]"
                />
                {err(registerForm.formState, "email") && (
                  <span className="text-xs font-normal text-[#c0392b]">{err(registerForm.formState, "email")}</span>
                )}
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Password
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...registerForm.register("password")}
                  className="h-11 rounded-lg border border-[#e4d9cc] px-3 text-sm font-normal outline-none focus:border-[#b8521f]"
                />
                {err(registerForm.formState, "password") && (
                  <span className="text-xs font-normal text-[#c0392b]">{err(registerForm.formState, "password")}</span>
                )}
              </label>
              <button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#b8521f] text-sm font-semibold text-white transition-colors hover:bg-[#9c4519] disabled:opacity-60"
              >
                {registerForm.formState.isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Sign Up
              </button>
            </form>
          )}

          {/* Divider + guest */}
          <div className="my-5 flex items-center gap-3 text-xs text-[#5c5147]">
            <span className="h-px flex-1 bg-[#f0e8de]" />
            or
            <span className="h-px flex-1 bg-[#f0e8de]" />
          </div>
          <Link
            href="/menu"
            className="block rounded-xl border border-[#e4d9cc] py-3 text-center text-sm font-semibold text-[#2b2119] transition-colors hover:border-[#b8521f]"
          >
            Continue as guest
          </Link>
        </div>
      </main>
    </div>
  );
}