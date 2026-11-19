import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { SubscribePanel } from "@/components/SubscribePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isTopicSlug, listTopicWeeks } from "@/lib/content";
import { TOPIC_BLURBS, TOPIC_LABELS, TOPICS } from "@/lib/site";

type PageProps = {
  params: Promise<{ topic: string }>;
};

export function generateStaticParams() {
  return TOPICS.map((topic) => ({ topic }));
}

export async function generateMetadata({ params }: PageProps) {
  const { topic } = await params;
  if (!isTopicSlug(topic)) return { title: "Topic" };
  return {
    title: TOPIC_LABELS[topic],
    description: TOPIC_BLURBS[topic],
  };
}

export default async function TopicArchivePage({ params }: PageProps) {
  const { topic } = await params;
  if (!isTopicSlug(topic)) notFound();

  const briefings = listTopicWeeks(topic);

  return (
    <div className="page-spacing">
      <div className="magazine-shell">
        <PageBreadcrumbs
          items={[
            { label: "Weekly Frontier", href: "/" },
            { label: TOPIC_LABELS[topic] },
          ]}
        />
        <p className="section-kicker mt-5">Topic</p>
        <h1 className="page-title mt-2">{TOPIC_LABELS[topic]}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          {TOPIC_BLURBS[topic]}
        </p>

        <hr className="soft-rule mt-10" />

        <div>
          {briefings.map((briefing, index) => (
            <article key={briefing.week}>
              {index > 0 ? <hr className="soft-rule" /> : null}
              <div className="py-7">
                <p className="section-kicker">
                  {briefing.period ?? briefing.week}
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  <Link
                    href={`/topic/${topic}/${briefing.week}/`}
                    className="headline-link"
                  >
                    {briefing.stories[0]?.title ??
                      `Week of ${briefing.week.replace("week-of-", "")}`}
                  </Link>
                </h2>
                <div className="meta-text mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="font-normal"
                  >
                    {briefing.stories.length}{" "}
                    {briefing.stories.length === 1 ? "story" : "stories"}
                  </Badge>
                  {briefing.coverage ? <span>{briefing.coverage}</span> : null}
                </div>
                <ul className="story-list mt-4 space-y-2">
                  {briefing.stories.slice(0, 3).map((story) => (
                    <li key={story.title}>
                      <Link
                        href={`/topic/${topic}/${briefing.week}/`}
                        className="headline-link text-sm font-medium sm:text-[0.95rem]"
                      >
                        {story.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <Button variant="outline" size="sm" className="border-border/70" asChild>
                    <Link href={`/topic/${topic}/${briefing.week}/`}>
                      Open briefing
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {briefings.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No briefings for this topic yet.
            </p>
          ) : null}
        </div>

        <div className="mt-16">
          <SubscribePanel />
        </div>
      </div>
    </div>
  );
}
