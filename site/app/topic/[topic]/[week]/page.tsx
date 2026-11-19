import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { StoryBlock } from "@/components/StoryBlock";
import { SubscribePanel } from "@/components/SubscribePanel";
import { Button } from "@/components/ui/button";
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
        <PageBreadcrumbs
          items={[
            { label: "Weekly Frontier", href: "/" },
            { label: TOPIC_LABELS[topic], href: `/topic/${topic}/` },
            { label: briefing.period ?? week },
          ]}
        />
        <p className="section-kicker mt-5">{TOPIC_LABELS[topic]}</p>
        <h1 className="page-title mt-2">
          {TOPIC_LABELS[topic]} briefing
          <span className="mt-2 block text-[0.55em] font-medium tracking-normal text-muted-foreground">
            {briefing.period ?? week}
          </span>
        </h1>
        {briefing.coverage ? (
          <p className="meta-text mt-3">{briefing.coverage}</p>
        ) : null}
        <div className="mt-5">
          <Button variant="outline" size="sm" className="border-border/70" asChild>
            <Link href={`/week/${week}/`}>View the full edition</Link>
          </Button>
        </div>

        <hr className="soft-rule mt-10" />

        <div>
          {briefing.stories.map((story, index) => (
            <StoryBlock
              key={story.title}
              story={story}
              showSeparator={index > 0}
            />
          ))}
        </div>

        <div className="mt-16">
          <SubscribePanel />
        </div>
      </article>
    </div>
  );
}
