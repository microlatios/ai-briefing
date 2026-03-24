import { neon } from "@neondatabase/serverless";
import type { Briefing, RawSourceItem, TopStory } from "./types";

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return neon(databaseUrl);
}

/** Ensures table exists on every cold start (dashboard only queried SELECT before). */
let briefingsSchemaReady: Promise<void> | null = null;

async function ensureBriefingsTable(): Promise<void> {
  if (!briefingsSchemaReady) {
    briefingsSchemaReady = initBriefingsTable().catch((err) => {
      briefingsSchemaReady = null;
      throw err;
    });
  }
  await briefingsSchemaReady;
}

type BriefingRow = {
  id: string;
  date: string;
  top_stories: unknown;
  analysis: string;
  personal_implications: string;
  raw_sources: unknown;
  created_at: string;
};

function toBriefing(row: BriefingRow): Briefing {
  return {
    id: row.id,
    date: row.date,
    top_stories: row.top_stories as TopStory[],
    analysis: row.analysis,
    personal_implications: row.personal_implications,
    raw_sources: (row.raw_sources as RawSourceItem[] | null) ?? null,
    created_at: row.created_at,
  };
}

export async function initBriefingsTable(): Promise<void> {
  const sql = getSql();
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  } catch {
    /* Neon/PG may already provide gen_random_uuid without extension */
  }
  await sql`
    CREATE TABLE IF NOT EXISTS briefings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE UNIQUE NOT NULL,
      top_stories JSONB NOT NULL,
      analysis TEXT NOT NULL,
      personal_implications TEXT NOT NULL,
      raw_sources JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function upsertBriefing(input: {
  date: string;
  topStories: TopStory[];
  analysis: string;
  personalImplications: string;
  rawSources: RawSourceItem[];
}): Promise<void> {
  await ensureBriefingsTable();
  const sql = getSql();
  await sql`
    INSERT INTO briefings (date, top_stories, analysis, personal_implications, raw_sources)
    VALUES (${input.date}, ${JSON.stringify(input.topStories)}::jsonb, ${input.analysis}, ${input.personalImplications}, ${JSON.stringify(input.rawSources)}::jsonb)
    ON CONFLICT (date)
    DO UPDATE SET
      top_stories = EXCLUDED.top_stories,
      analysis = EXCLUDED.analysis,
      personal_implications = EXCLUDED.personal_implications,
      raw_sources = EXCLUDED.raw_sources
  `;
}

export async function getLatestBriefing(): Promise<Briefing | null> {
  await ensureBriefingsTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, date::text, top_stories, analysis, personal_implications, raw_sources, created_at::text
    FROM briefings
    ORDER BY date DESC
    LIMIT 1
  `) as BriefingRow[];
  if (rows.length === 0) return null;
  return toBriefing(rows[0]);
}

export async function getBriefingByDate(date: string): Promise<Briefing | null> {
  await ensureBriefingsTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, date::text, top_stories, analysis, personal_implications, raw_sources, created_at::text
    FROM briefings
    WHERE date = ${date}
    LIMIT 1
  `) as BriefingRow[];
  if (rows.length === 0) return null;
  return toBriefing(rows[0]);
}

export async function getRecentBriefings(limit: number): Promise<Briefing[]> {
  await ensureBriefingsTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT id, date::text, top_stories, analysis, personal_implications, raw_sources, created_at::text
    FROM briefings
    ORDER BY date DESC
    LIMIT ${limit}
  `) as BriefingRow[];
  return rows.map(toBriefing);
}
