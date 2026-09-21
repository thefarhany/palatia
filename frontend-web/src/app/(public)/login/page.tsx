import type { Metadata } from "next";

import { CustomerAuth } from "@/components/auth/customer-auth";

// Login customer (dari landing). Staff login tetap di /login/staff.
export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return <CustomerAuth />;
}