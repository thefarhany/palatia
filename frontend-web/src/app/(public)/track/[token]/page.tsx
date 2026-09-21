import type { Metadata } from "next";
import { TrackView } from "@/components/public/track/track-view";

export const metadata: Metadata = { title: "Track Order" };

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return <TrackView token={token} />;
}
