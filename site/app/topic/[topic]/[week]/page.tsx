import { notFound } from "next/navigation";
import { TopicBriefingPage } from "@/components/TopicBriefingPage";
import {
  isTopicSlug,
  listTopicWeeks,
  loadTopicBriefing,
} from "@/lib/content";
import { TOPIC_LABELS, TOPICS } from "@/lib/site";

type PageProps = {
  params: Promise<{ topic: string; week: string }>;
};

export function generateStaticParams() {
  return TOPICS.flatMap((topic) =>
    listTopicWeeks(topic).map((briefing) => ({
      topic,
      week: briefing.week,
    })),
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { topic, week } = await params;
  if (!isTopicSlug(topic)) return { title: "Briefing" };
  const briefing = loadTopicBriefing(topic, week);
  return {
    title: `${TOPIC_LABELS[topic]} · ${briefing?.period ?? week}`,
    description: `${TOPIC_LABELS[topic]} briefing for ${briefing?.period ?? week}.`,
  };
}

export default async function TopicWeekPage({ params }: PageProps) {
  const { topic, week } = await params;
  if (!isTopicSlug(topic)) notFound();
  const briefing = loadTopicBriefing(topic, week);
  if (!briefing) notFound();

  return (
    <TopicBriefingPage
      topic={topic}
      briefing={briefing}
      weeks={listTopicWeeks(topic).map(({ week, period }) => ({ week, period }))}
    />
  );
}
