export const siteUrl = "https://weekly.cyborgoat.com";
export const portfolioUrl = "https://www.cyborgoat.com";
export const githubUrl = "https://github.com/cyborgoat";
export const githubRepoUrl = "https://github.com/cyborgoat/weekly-frontier";
export const basePath = "";

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

/** Public asset path (next/image omits basePath when unoptimized). */
export function assetPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}

export function topicLabel(topic: string) {
  return TOPIC_LABELS[topic as TopicSlug] ?? topic;
}
