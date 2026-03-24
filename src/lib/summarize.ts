import Anthropic from "@anthropic-ai/sdk";
import type { NeutralSummary, RawSourceItem } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FALLBACK_MODELS = [
  "claude-3-7-sonnet-latest",
  "claude-3-5-sonnet-20241022",
];

function modelCandidates(): string[] {
  const preferred = process.env.ANTHROPIC_MODEL?.trim();
  return preferred ? [preferred, ...FALLBACK_MODELS] : FALLBACK_MODELS;
}

async function createWithModelFallback(input: {
  max_tokens: number;
  temperature: number;
  system: string;
  messages: Array<{ role: "user"; content: string }>;
}) {
  let lastError: unknown;
  for (const model of modelCandidates()) {
    try {
      return await anthropic.messages.create({
        model,
        ...input,
      });
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("not_found_error")) {
        throw error;
      }
    }
  }
  throw new Error(
    `No valid Anthropic model found. Set ANTHROPIC_MODEL in env vars. Last error: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

const SUMMARIZE_SYSTEM_PROMPT = `You are an AI news analyst.
Given podcast-derived source items from the last 48 hours, produce:

1) top_stories: The 5 most significant AI stories. For each item include:
- rank (1-5)
- headline (one line)
- summary (2-3 sentences, factual, no hype)
- source_url
- source_name
- tag: "corporate" for big company or policy/institution moves; "grassroots" for builders, open source, indie, and practitioner adoption stories.

2) analysis: A 3-5 sentence neutral editorial paragraph comparing top-down corporate direction vs what practitioners are shipping and adopting.

Return strict JSON only:
{
  "top_stories": [...],
  "analysis": "..."
}`;

const PERSONAL_SYSTEM_PROMPT = `You are a strategic advisor.
Write 3-5 sentences for "Personal Implications" based on:
- today's neutral summary
- the user's personal context

Requirements:
- Keep the tone practical and specific.
- Include one concrete tool or development to try now.
- Explain why it is relevant to this user's partner/channel career positioning and side projects.
- Avoid generic advice.

Return plain text only.`;

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return valid JSON.");
  }
  return text.slice(start, end + 1);
}

export async function summarizeNeutral(
  sources: RawSourceItem[]
): Promise<NeutralSummary> {
  const prompt = `Source items:\n${JSON.stringify(sources, null, 2)}`;

  const response = await createWithModelFallback({
    max_tokens: 1800,
    temperature: 0.2,
    system: SUMMARIZE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");
  const parsed = JSON.parse(extractJson(text)) as NeutralSummary;

  if (!Array.isArray(parsed.top_stories) || typeof parsed.analysis !== "string") {
    throw new Error("Unexpected summary response shape.");
  }

  parsed.top_stories = parsed.top_stories.slice(0, 5).map((story, index) => ({
    ...story,
    rank: index + 1,
  }));

  return parsed;
}

export async function summarizePersonalImplications(input: {
  neutralSummary: NeutralSummary;
  personalContext: string;
}): Promise<string> {
  const response = await createWithModelFallback({
    max_tokens: 600,
    temperature: 0.3,
    system: PERSONAL_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Neutral summary:\n${JSON.stringify(
          input.neutralSummary,
          null,
          2
        )}\n\nPersonal context:\n${input.personalContext}`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Personal implications response was empty.");
  }

  return text;
}
