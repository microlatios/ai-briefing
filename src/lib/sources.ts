import Parser from "rss-parser";
import type { RawSourceItem } from "./types";

const parser = new Parser();

const ITUNES_LOOKUP_URL =
  "https://itunes.apple.com/lookup?id=1680633614&entity=podcast";

function toIsoDate(value: string | undefined): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

async function getPodcastRssFeedUrl(): Promise<string> {
  const response = await fetch(ITUNES_LOOKUP_URL, {
    headers: {
      "User-Agent": "ai-briefing/1.0",
    },
    next: { revalidate: 3600 },
  });
  if (!response.ok) {
    throw new Error(`iTunes lookup failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    results?: Array<{ feedUrl?: string }>;
  };
  const feedUrl = data.results?.[0]?.feedUrl;
  if (!feedUrl) {
    throw new Error("Could not resolve podcast RSS feed URL.");
  }
  return feedUrl;
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function fetchPodcastItems(hoursBack = 48): Promise<RawSourceItem[]> {
  const feedUrl = await getPodcastRssFeedUrl();
  const feed = await parser.parseURL(feedUrl);
  const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;

  return (feed.items ?? [])
    .map((item) => ({
      title: item.title?.trim() || "Untitled episode",
      url: item.link?.trim() || "",
      sourceName: "The AI Daily Brief",
      publishedAt: toIsoDate(item.isoDate ?? item.pubDate),
      description: stripHtml(
        (item["content:encoded"] as string | undefined) ??
          item.content ??
          item.contentSnippet ??
          item.summary ??
          ""
      ),
    }))
    .filter((item) => item.url)
    .filter((item) => new Date(item.publishedAt).getTime() >= cutoff)
    .slice(0, 12);
}
