import { WeekPicker } from "@/components/WeekPicker";
import { notFound } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { BriefingStories } from "@/components/BriefingStories";
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="page-title mt-2">
            {TOPIC_LABELS[topic]} briefing
            <span className="mt-2 block text-[0.55em] font-medium tracking-normal text-muted-foreground">
              {briefing.period ?? week}
            </span>
          </h1>
          <WeekPicker
            current={week}
            weeks={listTopicWeeks(topic).map(({ week, period }) => ({ week, period }))}
            topic={topic}
          />
        </div>
        {briefing.coverage ? (
          <p className="meta-text mt-3">{briefing.coverage}</p>
        ) : null}

        <BriefingStories stories={briefing.stories} />
      </article>
    </div>
  );
}
