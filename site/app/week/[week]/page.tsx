import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBreadcrumbs } from "@/components/PageBreadcrumbs";
import { StoryBlock } from "@/components/StoryBlock";
import { SubscribePanel } from "@/components/SubscribePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listWeekSlugs, loadWeekEdition } from "@/lib/content";

type PageProps = {
  params: Promise<{ week: string }>;
};

export function generateStaticParams() {
  return listWeekSlugs().map((week) => ({ week }));
}

export async function generateMetadata({ params }: PageProps) {
  const { week } = await params;
  const edition = loadWeekEdition(week);
  if (!edition) return { title: "Edition" };
  return {
    title: edition.period ?? week,
    description: `Weekly Frontier edition for ${edition.period ?? week}.`,
  };
}

export default async function WeekPage({ params }: PageProps) {
  const { week } = await params;
  const edition = loadWeekEdition(week);
  if (!edition) notFound();

  const inProgress = Boolean(
    edition.coverage?.toLowerCase().includes("in progress"),
  );

  return (
    <div className="page-spacing">
      <article className="magazine-shell">
        <PageBreadcrumbs
          items={[
            { label: "Weekly Frontier", href: "/" },
            { label: edition.period ?? week },
          ]}
        />
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <p className="section-kicker">Edition</p>
          {inProgress ? <Badge variant="secondary">In progress</Badge> : null}
        </div>
        <h1 className="page-title mt-3">{edition.period ?? edition.week}</h1>
        {edition.coverage ? (
          <p className="meta-text mt-3">{edition.coverage}</p>
        ) : null}

        {edition.highlights.length > 0 ? (
          <section className="mt-12">
            <hr className="soft-rule" />
            <p className="section-kicker mt-8">Highlights</p>
            <h2 className="section-title mt-2">This week&apos;s signals</h2>
            <ol className="highlight-rail mt-6">
              {edition.highlights.map((highlight, index) => (
                <li key={`${highlight.url}-${index}`}>
                  <p className="section-kicker mb-2">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <a
                    href={highlight.url}
                    className="headline-link text-[1.05rem] font-semibold tracking-tight sm:text-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {highlight.title}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <nav aria-label="Topics in this edition" className="mt-12">
          <hr className="soft-rule" />
          <p className="section-kicker mt-8">Topics</p>
          <h2 className="section-title mt-2">Jump to a briefing</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {edition.topics.map((topic) => (
              <div
                key={topic.topic}
                className="flex flex-wrap items-center gap-1"
              >
                <Badge
                  asChild
                  variant="outline"
                  className="border-border/70 font-normal"
                >
                  <a href={`#${topic.topic}`}>{topic.label}</a>
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/topic/${topic.topic}/${edition.week}/`}>
                    Full briefing
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </nav>

        {edition.topics.map((topic) => (
          <section
            key={topic.topic}
            id={topic.topic}
            className="mt-14 scroll-mt-24"
          >
            <hr className="soft-rule" />
            <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="section-kicker">{topic.label}</p>
                <h2 className="section-title mt-2">{topic.label} briefing</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/topic/${topic.topic}/${edition.week}/`}>
                  Topic page
                </Link>
              </Button>
            </div>
            <div className="mt-2">
              {topic.stories.map((story, index) => (
                <StoryBlock
                  key={story.title}
                  story={story}
                  showSeparator={index > 0}
                />
              ))}
            </div>
          </section>
        ))}

        <div className="mt-16">
          <SubscribePanel />
        </div>
      </article>
    </div>
  );
}
