import fs from "node:fs";
import path from "node:path";
import { TOPIC_LABELS, TOPICS, type TopicSlug } from "@/lib/site";

const REPO_ROOT = path.join(process.cwd(), "..");

export type Highlight = {
  title: string;
  url: string;
};

export type Story = {
  title: string;
  published: string | null;
  summary: string;
  whyItMatters: string | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  tags: string[];
};

export type TopicBriefing = {
  topic: TopicSlug;
  label: string;
  week: string;
  year: number;
  period: string | null;
  coverage: string | null;
  stories: Story[];
};

export type WeekEdition = {
  week: string;
  year: number;
  period: string | null;
  coverage: string | null;
  highlights: Highlight[];
  topics: TopicBriefing[];
};

function readText(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function extractBlock(text: string, name: string) {
  const match = text.match(
    new RegExp(`<!-- ${name}:start -->\\s*([\\s\\S]*?)\\s*<!-- ${name}:end -->`),
  );
  return match?.[1]?.trim() || null;
}

function parsePeriod(text: string) {
  const match = text.match(/^Reporting week:\s*(.+)$/m);
  // Dates are Los Angeles time; older pages may still include an explicit suffix.
  return match?.[1]?.replace(/\s*·\s*Los Angeles time.*$/, "").trim() || null;
}

function parseHighlights(text: string): Highlight[] {
  const section = text.split(/^## Highlights\s*$/m)[1];
  if (!section) return [];
  const body = section.split(/^## /m)[0];
  const highlights: Highlight[] = [];
  for (const match of body.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)/gm)) {
    highlights.push({ title: match[1], url: match[2] });
  }
  return highlights;
}

function parseSource(line: string) {
  const match = line.match(/^Source:\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (!match) return { label: null, url: null };
  return { label: match[1], url: match[2] };
}

function parseStories(text: string): Story[] {
  const parts = text.split(/^## /m).slice(1);
  const stories: Story[] = [];

  for (const part of parts) {
    const lines = part.trim().split(/\n/);
    const title = lines[0]?.trim();
    if (!title || title === "Topic briefings" || title === "Highlights") continue;

    let published: string | null = null;
    let whyItMatters: string | null = null;
    let sourceLabel: string | null = null;
    let sourceUrl: string | null = null;
    let tags: string[] = [];
    const summaryLines: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^Published:\s*/.test(line)) {
        published = line.replace(/^Published:\s*/, "").trim();
        continue;
      }
      if (line.startsWith("**Why it matters:**")) {
        whyItMatters = line.replace("**Why it matters:**", "").trim();
        continue;
      }
      if (line.startsWith("Source:")) {
        const source = parseSource(line);
        sourceLabel = source.label;
        sourceUrl = source.url;
        continue;
      }
      if (line.startsWith("Tags:")) {
        tags = line
          .replace(/^Tags:\s*/, "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
        continue;
      }
      if (line.trim() === "") continue;
      summaryLines.push(line.trim());
    }

    stories.push({
      title,
      published,
      summary: summaryLines.join(" "),
      whyItMatters,
      sourceLabel,
      sourceUrl,
      tags,
    });
  }

  return stories;
}

function listWeekFiles(directory: string) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((yearDir) => {
      const yearPath = path.join(directory, yearDir.name);
      return fs
        .readdirSync(yearPath)
        .filter((name) => /^week-of-\d{4}-\d{2}-\d{2}\.md$/.test(name))
        .map((name) => path.join(yearPath, name));
    })
    .sort()
    .reverse();
}

function weekFromPath(filePath: string) {
  return path.basename(filePath, ".md");
}

function yearFromWeek(week: string) {
  return Number(week.replace("week-of-", "").slice(0, 4));
}

export function loadTopicBriefing(
  topic: TopicSlug,
  week: string,
): TopicBriefing | null {
  const year = yearFromWeek(week);
  const filePath = path.join(
    REPO_ROOT,
    "topics",
    topic,
    String(year),
    `${week}.md`,
  );
  if (!fs.existsSync(filePath)) return null;
  const text = readText(filePath);
  return {
    topic,
    label: TOPIC_LABELS[topic],
    week,
    year,
    period: parsePeriod(text),
    coverage: extractBlock(text, "coverage"),
    stories: parseStories(text),
  };
}

export function loadWeekEdition(week: string): WeekEdition | null {
  const year = yearFromWeek(week);
  const filePath = path.join(REPO_ROOT, "weekly", String(year), `${week}.md`);
  if (!fs.existsSync(filePath)) return null;
  const text = readText(filePath);
  const topics = TOPICS.map((topic) => loadTopicBriefing(topic, week)).filter(
    (briefing): briefing is TopicBriefing => briefing !== null,
  );

  return {
    week,
    year,
    period: parsePeriod(text),
    coverage: extractBlock(text, "coverage"),
    highlights: parseHighlights(text),
    topics,
  };
}

export function listWeekSlugs(): string[] {
  return listWeekFiles(path.join(REPO_ROOT, "weekly")).map(weekFromPath);
}

export function listTopicWeeks(topic: TopicSlug): TopicBriefing[] {
  return listWeekFiles(path.join(REPO_ROOT, "topics", topic))
    .map((filePath) => loadTopicBriefing(topic, weekFromPath(filePath)))
    .filter((briefing): briefing is TopicBriefing => briefing !== null);
}

export function latestTopicWeek(topic: TopicSlug): string | null {
  return listTopicWeeks(topic)[0]?.week ?? null;
}

export function topicHref(topic: TopicSlug, week?: string | null) {
  const targetWeek = week ?? latestTopicWeek(topic);
  return targetWeek ? `/topic/${topic}/${targetWeek}/` : `/topic/${topic}/`;
}

export function isTopicSlug(value: string): value is TopicSlug {
  return (TOPICS as readonly string[]).includes(value);
}
