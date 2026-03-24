import { notFound } from "next/navigation";
import { BriefingView } from "@/components/BriefingView";
import { ConfigError } from "@/components/ConfigError";
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
  let requested: Awaited<ReturnType<typeof getBriefingByDate>>;
  let fallback: Awaited<ReturnType<typeof getLatestBriefing>>;
  let recent: Awaited<ReturnType<typeof getRecentBriefings>>;
  try {
    [requested, fallback, recent] = await Promise.all([
      getBriefingByDate(date),
      getLatestBriefing(),
      getRecentBriefings(30),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("DATABASE_URL")) {
      return (
        <ConfigError
          title="Database not configured"
          message={`Add DATABASE_URL to your environment (local .env.local or Vercel Project → Settings → Environment Variables), then redeploy or restart dev.\n\nDetails: ${message}`}
        />
      );
    }
    return (
      <ConfigError
        title="Could not load briefings"
        message={`Check that Postgres is reachable and DATABASE_URL is correct.\n\nDetails: ${message}`}
      />
    );
  }

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
