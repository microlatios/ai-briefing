import { BriefingView } from "@/components/BriefingView";
import { ConfigError } from "@/components/ConfigError";
import { getLatestBriefing, getRecentBriefings } from "@/lib/db";
import { generateNowAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  let latest: Awaited<ReturnType<typeof getLatestBriefing>>;
  let recent: Awaited<ReturnType<typeof getRecentBriefings>>;
  try {
    [latest, recent] = await Promise.all([
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

  if (!latest) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-5 pb-16 pt-16">
        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
          AI Daily Briefing
        </p>
        <h1 className="mt-3 text-5xl leading-tight md:text-6xl">No briefing yet</h1>
        <p className="mt-5 max-w-xl font-sans text-[16px] leading-7 text-stone-700">
          Generate your first briefing from the latest episodes of The AI Daily
          Brief podcast.
        </p>
        <form action={generateNowAction}>
          <button className="mt-6 rounded border border-stone-300 px-4 py-2 font-sans text-sm hover:border-stone-500">
            Generate now
          </button>
        </form>
      </main>
    );
  }

  const recentDates = recent.map((entry) => entry.date);
  return (
    <>
      <div className="mx-auto w-full max-w-[680px] px-5 pt-6">
        <form action={generateNowAction}>
          <button className="rounded border border-stone-300 px-3 py-1.5 font-sans text-xs uppercase tracking-wider text-stone-600 hover:border-stone-500 hover:text-stone-900">
            Generate now
          </button>
        </form>
      </div>
      <BriefingView briefing={latest} recentDates={recentDates} />
    </>
  );
}
