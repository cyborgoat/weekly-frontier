import { notFound } from "next/navigation";
import { ClientRedirect } from "@/components/ClientRedirect";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { isTopicSlug, listTopicWeeks, topicHref } from "@/lib/content";
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
  const latest = listTopicWeeks(topic)[0];
  if (!latest) {
    return {
      title: TOPIC_LABELS[topic],
      description: TOPIC_BLURBS[topic],
    };
  }
  return {
    title: `${TOPIC_LABELS[topic]} · ${latest.period ?? latest.week}`,
    description: `${TOPIC_LABELS[topic]} briefing for ${latest.period ?? latest.week}.`,
  };
}

export default async function TopicPage({ params }: PageProps) {
  const { topic } = await params;
  if (!isTopicSlug(topic)) notFound();

  const latest = listTopicWeeks(topic)[0];
  if (!latest) {
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
          <p className="mt-6">No briefings for this topic yet.</p>
        </div>
      </div>
    );
  }

  // Static export cannot emit HTTP redirects; client replace keeps the URL
  // on the newest week edition.
  return <ClientRedirect href={topicHref(topic, latest.week)} />;
}
