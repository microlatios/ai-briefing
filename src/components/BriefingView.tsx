import Link from "next/link";
import type { Briefing } from "@/lib/types";

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00+08:00`);
  return parsed.toLocaleDateString("en-SG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Singapore",
  });
}

export function BriefingView(props: {
  briefing: Briefing;
  recentDates: string[];
  isFallback?: boolean;
}) {
  const { briefing, recentDates, isFallback = false } = props;
  return (
    <main className="mx-auto w-full max-w-[680px] px-5 pb-16 pt-10 text-stone-900">
      <div className="animate-fade-up">
        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">
          AI Daily Briefing
        </p>
        <h1 className="mt-3 text-5xl leading-tight md:text-6xl">
          {formatDateLabel(briefing.date)}
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          Last generated{" "}
          {new Date(briefing.created_at).toLocaleString("en-SG", {
            timeZone: "Asia/Singapore",
          })}
        </p>
        {isFallback ? (
          <p className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Today is not available yet. Showing the latest successful briefing.
          </p>
        ) : null}
      </div>

      <section className="mt-12 animate-fade-up-delayed">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl">Top AI Stories</h2>
          <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
            Today
          </Link>
        </div>
        {briefing.top_stories.map((story) => (
          <article key={story.rank} className="story-card">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-stone-500">
                #{story.rank}
              </span>
              <span
                className={`tag ${
                  story.tag === "corporate" ? "tag-corporate" : "tag-grassroots"
                }`}
              >
                {story.tag}
              </span>
            </div>
            <h3 className="text-[1.25rem] leading-snug">{story.headline}</h3>
            <p className="mt-2 font-sans text-[15px] leading-7 text-stone-700">
              {story.summary}
            </p>
            <a
              href={story.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block font-sans text-sm text-[#355f7a] hover:underline"
            >
              {story.source_name}
            </a>
          </article>
        ))}
      </section>

      <section className="mt-12 animate-fade-up-more">
        <h2 className="text-2xl">Corporate vs Ground-Level View</h2>
        <p className="mt-4 font-sans text-[16px] leading-8 text-stone-800">
          {briefing.analysis}
        </p>
      </section>

      <section className="mt-12 animate-fade-up-more rounded border border-amber-200 bg-amber-50/70 p-5">
        <h2 className="text-2xl">Personal Implications</h2>
        <p className="mt-4 font-sans text-[16px] leading-8 text-stone-800">
          {briefing.personal_implications}
        </p>
      </section>

      <section className="mt-12 border-t border-stone-200 pt-6">
        <h3 className="text-lg">Recent</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {recentDates.map((date) => (
            <Link key={date} className="recent-pill" href={`/briefing/${date}`}>
              {date}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
