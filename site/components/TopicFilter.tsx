"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { WeekEdition } from "@/lib/content";
import { TOPIC_LABELS, TOPICS, type TopicSlug } from "@/lib/site";

type TopicFilterProps = {
  editions: WeekEdition[];
};

type PreviewItem = {
  key: string;
  title: string;
  href: string;
  kicker?: string;
  external?: boolean;
};

export function TopicFilter({ editions }: TopicFilterProps) {
  const [selected, setSelected] = useState<TopicSlug[]>([]);

  const filtered = useMemo(() => {
    if (selected.length === 0) return editions;
    return editions
      .map((edition) => ({
        ...edition,
        topics: edition.topics.filter((topic) => selected.includes(topic.topic)),
      }))
      .filter((edition) => edition.topics.length > 0);
  }, [editions, selected]);

  function toggle(topic: TopicSlug) {
    setSelected((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic],
    );
  }

  function previews(edition: WeekEdition): PreviewItem[] {
    if (selected.length === 0) {
      return edition.highlights.slice(0, 3).map((highlight, index) => ({
        key: `${edition.week}-h-${index}`,
        title: highlight.title,
        href: highlight.url,
        external: true,
      }));
    }

    return edition.topics.flatMap((topic) =>
      topic.stories.slice(0, 2).map((story, index) => ({
        key: `${edition.week}-${topic.topic}-${index}`,
        title: story.title,
        href: story.sourceUrl ?? `/topic/${topic.topic}/${edition.week}/`,
        kicker: TOPIC_LABELS[topic.topic],
        external: Boolean(story.sourceUrl),
      })),
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="section-title">Browse by week</h2>
          {selected.length > 0 ? (
            <button
              type="button"
              className="text-link"
              onClick={() => setSelected([])}
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Filter the archive by topic, or open any week for the full magazine
          layout.
        </p>
        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Topic filters"
        >
          {TOPICS.map((topic) => {
            const active = selected.includes(topic);
            return (
              <Button
                key={topic}
                type="button"
                size="sm"
                variant={active ? "brand" : "outline"}
                aria-pressed={active}
                onClick={() => toggle(topic)}
              >
                {TOPIC_LABELS[topic]}
              </Button>
            );
          })}
        </div>
        <p className="meta-text mt-4 flex flex-wrap gap-x-3 gap-y-1">
          <span>Topic archives:</span>
          {TOPICS.map((topic) => (
            <Link key={topic} href={`/topic/${topic}/`} className="text-link">
              {TOPIC_LABELS[topic]}
            </Link>
          ))}
        </p>
      </div>

      <div className="space-y-0">
        {filtered.map((edition) => (
          <article
            key={edition.week}
            className="border-t border-rule py-6 first:border-t-0"
          >
            <p className="meta-text">{edition.period ?? edition.week}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">
              <Link href={`/week/${edition.week}/`} className="hover:text-brand">
                Week of {edition.week.replace("week-of-", "")}
              </Link>
            </h3>
            {edition.coverage ? (
              <p className="meta-text mt-2">{edition.coverage}</p>
            ) : null}
            <ul className="story-list mt-4 space-y-2.5">
              {previews(edition).map((item) => (
                <li key={item.key} className="leading-snug">
                  {item.kicker ? (
                    <span className="meta-text mr-2">{item.kicker}</span>
                  ) : null}
                  {item.external ? (
                    <a
                      href={item.href}
                      className="text-[0.975rem] font-medium hover:text-brand"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-[0.975rem] font-medium hover:text-brand"
                    >
                      {item.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              <Link href={`/week/${edition.week}/`} className="text-link">
                Read the edition
              </Link>
              {edition.topics.map((topic) => (
                <Link
                  key={topic.topic}
                  href={`/topic/${topic.topic}/${edition.week}/`}
                  className="text-link"
                >
                  {topic.label}
                </Link>
              ))}
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="border-t border-rule py-6 text-sm text-muted-foreground">
            No editions match the selected topics yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
