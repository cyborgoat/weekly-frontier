import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryBlock } from "@/components/StoryBlock";
import { SubscribePanel } from "@/components/SubscribePanel";
import {
  listWeekSlugs,
  loadWeekEdition,
} from "@/lib/content";

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

  return (
    <div className="page-spacing">
      <article className="magazine-shell">
        <p className="meta-text">
          <Link href="/" className="text-link">
            Weekly Frontier
          </Link>
          {" · "}
          Edition
        </p>
        <h1 className="page-title mt-3">{edition.period ?? edition.week}</h1>
        {edition.coverage ? (
          <p className="meta-text mt-3">{edition.coverage}</p>
        ) : null}

        {edition.highlights.length > 0 ? (
          <section className="mt-10 border-t border-rule pt-8">
            <h2 className="section-title">Highlights</h2>
            <ol className="mt-5 space-y-4">
              {edition.highlights.map((highlight, index) => (
                <li key={`${highlight.url}-${index}`}>
                  <a
                    href={highlight.url}
                    className="text-lg font-semibold tracking-tight hover:text-brand"
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

        <nav aria-label="Topics in this edition" className="mt-10 border-t border-rule pt-8">
          <h2 className="section-title">Topics</h2>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {edition.topics.map((topic) => (
              <li key={topic.topic}>
                <a href={`#${topic.topic}`} className="text-link">
                  {topic.label}
                </a>
                {" · "}
                <Link
                  href={`/topic/${topic.topic}/${edition.week}/`}
                  className="text-link"
                >
                  Full briefing
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {edition.topics.map((topic) => (
          <section
            key={topic.topic}
            id={topic.topic}
            className="mt-12 scroll-mt-24 border-t border-rule pt-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="section-title">{topic.label}</h2>
              <Link
                href={`/topic/${topic.topic}/${edition.week}/`}
                className="text-link"
              >
                Topic page
              </Link>
            </div>
            <div className="mt-6">
              {topic.stories.map((story) => (
                <StoryBlock key={story.title} story={story} />
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
