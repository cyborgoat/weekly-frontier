import { WeekPicker } from "@/components/WeekPicker";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { BriefingStories } from "@/components/BriefingStories";
import type { TopicBriefing } from "@/lib/content";
import { topicHref } from "@/lib/content";
import { TOPIC_LABELS, type TopicSlug } from "@/lib/site";

export function TopicBriefingPage({
  topic,
  briefing,
  weeks,
}: {
  topic: TopicSlug;
  briefing: TopicBriefing;
  weeks: Pick<TopicBriefing, "week" | "period">[];
}) {
  return (
    <div className="page-spacing">
      <article className="magazine-shell">
        <PageBreadcrumbs
          items={[
            { label: "Weekly Frontier", href: "/" },
            { label: TOPIC_LABELS[topic], href: topicHref(topic) },
            { label: briefing.period ?? briefing.week },
          ]}
        />
        <p className="section-kicker mt-5">{TOPIC_LABELS[topic]}</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="page-title mt-2">
            {TOPIC_LABELS[topic]} briefing
            <span className="mt-2 block text-[0.55em] font-medium tracking-normal text-muted-foreground">
              {briefing.period ?? briefing.week}
            </span>
          </h1>
          <WeekPicker current={briefing.week} weeks={weeks} topic={topic} />
        </div>
        {briefing.coverage ? (
          <p className="meta-text mt-3">{briefing.coverage}</p>
        ) : null}

        <BriefingStories stories={briefing.stories} />
      </article>
    </div>
  );
}
