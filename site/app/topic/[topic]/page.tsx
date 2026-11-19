import Link from "next/link";
import { notFound } from "next/navigation";
import { SubscribePanel } from "@/components/SubscribePanel";
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
        <p className="meta-text">
          <Link href="/" className="text-link">
            Weekly Frontier
          </Link>
          {" · "}
          Topic
        </p>
        <h1 className="page-title mt-3">{TOPIC_LABELS[topic]}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          {TOPIC_BLURBS[topic]}
        </p>

        <div className="mt-10 space-y-0">
          {briefings.map((briefing) => (
            <article
              key={briefing.week}
              className="border-t border-rule py-6 first:border-t-0"
            >
              <p className="meta-text">{briefing.period ?? briefing.week}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight">
                <Link
                  href={`/topic/${topic}/${briefing.week}/`}
                  className="hover:text-brand"
                >
                  {briefing.stories[0]?.title ??
                    `Week of ${briefing.week.replace("week-of-", "")}`}
                </Link>
              </h2>
              <p className="meta-text mt-2">
                {briefing.stories.length}{" "}
                {briefing.stories.length === 1 ? "story" : "stories"}
                {briefing.coverage ? ` · ${briefing.coverage}` : ""}
              </p>
              <ul className="story-list mt-4 space-y-2">
                {briefing.stories.slice(0, 3).map((story) => (
                  <li key={story.title}>
                    <Link
                      href={`/topic/${topic}/${briefing.week}/`}
                      className="text-[0.975rem] font-medium hover:text-brand"
                    >
                      {story.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          ))}
          {briefings.length === 0 ? (
            <p className="border-t border-rule py-6 text-sm text-muted-foreground">
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
