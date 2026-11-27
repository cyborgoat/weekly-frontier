import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { listWeekSlugs, loadWeekEdition, topicHref } from "@/lib/content";

export default function HomePage() {
  const week = listWeekSlugs()[0];
  const latest = week && loadWeekEdition(week);
  if (!latest) {
    return (
      <div className="wide-shell page-spacing">
        <h1 className="page-title">Weekly Frontier</h1>
        <p>No briefings published yet.</p>
      </div>
    );
  }

  const [lead, ...supporting] = latest.highlights;
  const leadStory = latest.topics
    .flatMap((topic) => topic.stories)
    .find((story) => story.sourceUrl === lead?.url);
  const highlightTitles = new Set(latest.highlights.map((story) => story.title));

  return (
    <div className="wide-shell page-spacing">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-foreground pb-3">
        <p className="section-kicker font-semibold text-brand">Weekly highlights</p>
        <p className="meta-text">{latest.period ?? week}</p>
      </div>

      <section className="grid gap-8 py-8 lg:grid-cols-[3fr_2fr] lg:gap-14">
        <div>
          {latest.coverage && <p className="meta-text mb-4">{latest.coverage}</p>}
          <h1 className="text-balance text-[clamp(2.2rem,4.6vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.055em]">
            {lead ? <a href={lead.url} className="headline-link">{lead.title}</a> : "Weekly Frontier"}
          </h1>
          {leadStory?.summary && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {leadStory.summary}
            </p>
          )}
        </div>
        {supporting.length > 0 && (
          <div className="lg:border-l lg:pl-8">
            <h2 className="section-kicker mb-1">Also this week</h2>
            <ul className="divide-y">
              {supporting.map((story) => (
                <li key={story.url}>
                  <a className="headline-link flex items-start justify-between gap-4 py-4 text-lg leading-tight font-semibold" href={story.url}>
                    {story.title}
                    <ArrowUpRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {latest.topics.length > 0 && (
        <section className="mt-8 border-t-2 border-foreground pt-5 sm:mt-12" aria-labelledby="topic-highlights">
          <h2 id="topic-highlights" className="section-title">This week by topic</h2>
          <div className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-sm border bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {latest.topics.map((topic) => {
              const href = topicHref(topic.topic, topic.week);
              const story = topic.stories.find((story) => !highlightTitles.has(story.title)) ?? topic.stories[0];

              return (
                <article key={topic.topic} className="flex flex-col items-start bg-card p-5 sm:p-6">
                  <h3 className="section-kicker font-semibold text-brand">{topic.label}</h3>
                  {story && (
                    <>
                      <h4 className="mt-3 text-xl leading-tight font-semibold tracking-tight">
                        {story.sourceUrl ? (
                          <a className="headline-link" href={story.sourceUrl}>{story.title}</a>
                        ) : story.title}
                      </h4>
                      {story.summary && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{story.summary}</p>
                      )}
                    </>
                  )}
                  <div className="mt-auto pt-5">
                    <Link className="text-link inline-flex items-center gap-1.5" href={href}>
                      Read the {topic.label} briefing
                      <ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
