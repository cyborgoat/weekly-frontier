import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { Fragment } from "react";
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

  const [latest, ...earlier] = listTopicWeeks(topic);

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

        {latest ? (
          <section className="mt-8 border-t-2 border-foreground py-6">
            <p className="section-kicker text-brand">Latest briefing</p>
            <p className="meta-text mt-3">{latest.period ?? latest.week} · {latest.stories.length} {latest.stories.length === 1 ? "story" : "stories"}</p>
            <h2 className="mt-3 max-w-3xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              <Link className="headline-link" href={`/topic/${topic}/${latest.week}/`}>
                {latest.stories[0]?.title ?? "Read the weekly briefing"}
              </Link>
            </h2>
          </section>
        ) : <p className="mt-6">No briefings for this topic yet.</p>}

        {earlier.length > 0 && <section className="mt-8">
          <h2 className="section-title">Earlier weeks</h2>
          {earlier.map((briefing, index) => (
            <Fragment key={briefing.week}>
              {briefing.year !== earlier[index - 1]?.year && <h3 className="archive-year">{briefing.year}</h3>}
              <Link className="archive-row group" href={`/topic/${topic}/${briefing.week}/`}>
                <span className="font-semibold text-brand group-hover:underline">{briefing.period ?? briefing.week}</span>
                <span>{briefing.stories[0]?.title}</span>
              </Link>
            </Fragment>
          ))}
        </section>}
      </div>
    </div>
  );
}
