import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchPodcastItems } from "./sources";
import { getBriefingByDate, initBriefingsTable, upsertBriefing } from "./db";
import { sendBriefingEmail } from "./email";
import { summarizeNeutral, summarizePersonalImplications } from "./summarize";
import type { Briefing } from "./types";

async function readPersonalContext(): Promise<string> {
  const filePath = path.join(process.cwd(), "personal-context.md");
  return readFile(filePath, "utf8");
}

function todayInSgDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
  }).format(new Date());
}

export async function runBriefingJob(): Promise<Briefing> {
  await initBriefingsTable();

  const rawSources = await fetchPodcastItems();
  if (rawSources.length === 0) {
    throw new Error("No podcast source items found in the configured time window.");
  }

  const neutral = await summarizeNeutral(rawSources);
  const personalContext = await readPersonalContext();
  const personalImplications = await summarizePersonalImplications({
    neutralSummary: neutral,
    personalContext,
  });

  const date = todayInSgDateString();
  await upsertBriefing({
    date,
    topStories: neutral.top_stories,
    analysis: neutral.analysis,
    personalImplications,
    rawSources,
  });

  const saved = await getBriefingByDate(date);
  if (!saved) {
    throw new Error("Briefing could not be read back after save.");
  }

  await sendBriefingEmail(saved);
  return saved;
}
