import { notFound } from "next/navigation";
import { BriefingView } from "@/components/BriefingView";
import {
  getBriefingByDate,
  getLatestBriefing,
  getRecentBriefings,
} from "@/lib/db";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ date: string }>;
};

export default async function BriefingByDatePage({
  params,
}: PageProps) {
  const { date } = await params;
  const [requested, fallback, recent] = await Promise.all([
    getBriefingByDate(date),
    getLatestBriefing(),
    getRecentBriefings(30),
  ]);

  if (!requested && !fallback) {
    notFound();
  }

  return (
    <BriefingView
      briefing={requested ?? (fallback as NonNullable<typeof fallback>)}
      recentDates={recent.map((entry) => entry.date)}
      isFallback={!requested}
    />
  );
}
