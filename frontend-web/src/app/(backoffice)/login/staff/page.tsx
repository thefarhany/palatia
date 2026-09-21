import { Suspense } from "react";
import LoginForm from "@/components/auth/login-form";

export default function StaffLoginPage() {
  return (
    <Suspense>
      <LoginForm variant="staff" />
    </Suspense>
  );
}