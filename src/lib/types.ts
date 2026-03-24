export type StoryTag = "corporate" | "grassroots";

export type TopStory = {
  rank: number;
  headline: string;
  summary: string;
  source_url: string;
  source_name: string;
  tag: StoryTag;
};

export type Briefing = {
  id: string;
  date: string;
  top_stories: TopStory[];
  analysis: string;
  personal_implications: string;
  raw_sources: RawSourceItem[] | null;
  created_at: string;
};

export type RawSourceItem = {
  title: string;
  url: string;
  sourceName: string;
  publishedAt: string;
  description: string;
};

export type NeutralSummary = {
  top_stories: TopStory[];
  analysis: string;
};
