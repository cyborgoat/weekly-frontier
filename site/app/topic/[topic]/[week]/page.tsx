import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryBlock } from "@/components/StoryBlock";
import { SubscribePanel } from "@/components/SubscribePanel";
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
    <div className="page-spacing">
      <article className="magazine-shell">
        <p className="meta-text">
          <Link href="/" className="text-link">
            Weekly Frontier
          </Link>
          {" · "}
          <Link href={`/topic/${topic}/`} className="text-link">
            {TOPIC_LABELS[topic]}
          </Link>
        </p>
        <h1 className="page-title mt-3">
          {TOPIC_LABELS[topic]}
          <span className="block text-[0.55em] font-medium tracking-normal text-muted-foreground">
            {briefing.period ?? week}
          </span>
        </h1>
        {briefing.coverage ? (
          <p className="meta-text mt-3">{briefing.coverage}</p>
        ) : null}
        <p className="mt-4">
          <Link href={`/week/${week}/`} className="text-link">
            View the full edition
          </Link>
        </p>

        <div className="mt-10">
          {briefing.stories.map((story) => (
            <StoryBlock key={story.title} story={story} />
          ))}
        </div>

        <div className="mt-16">
          <SubscribePanel />
        </div>
      </article>
    </div>
  );
}
