export const siteUrl = "https://www.cyborgoat.com/weekly-frontier";
export const portfolioUrl = "https://www.cyborgoat.com";
export const githubUrl = "https://github.com/cyborgoat/weekly-frontier";
export const basePath = "/weekly-frontier";

export const TOPICS = [
  "ai",
  "technology",
  "politics",
  "finance",
  "science",
  "business",
] as const;

export type TopicSlug = (typeof TOPICS)[number];

export const TOPIC_LABELS: Record<TopicSlug, string> = {
  ai: "AI",
  technology: "Technology",
  politics: "Politics",
  finance: "Finance",
  science: "Science",
  business: "Business",
};

export const TOPIC_BLURBS: Record<TopicSlug, string> = {
  ai: "Research papers, model releases, evaluations, datasets, and research tools.",
  technology:
    "Computing, digital infrastructure, platforms, and emerging technologies.",
  politics: "International developments, public policy, and political reporting.",
  finance: "Monetary policy, economic developments, and financial news.",
  science: "Research discoveries, space, and developments across science.",
  business:
    "Companies, industries, markets, and changes in how business operates.",
};

export function feedUrl(stem: string) {
  return `${siteUrl}/${stem}.xml`;
}

/** Public asset path under GitHub Pages basePath (next/image omits it when unoptimized). */
export function assetPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function topicLabel(topic: string) {
  return TOPIC_LABELS[topic as TopicSlug] ?? topic;
}
