import type { Metadata } from "next";
import { PaymentSuccess } from "@/components/public/payment/success";

export const metadata: Metadata = { title: "Payment Successful" };

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <PaymentSuccess token={token ?? ""} />;
}
