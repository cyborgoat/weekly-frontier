"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Filter the archive by topic, or open any week for the full magazine
          layout.
        </p>
        <ToggleGroup
          type="multiple"
          variant="outline"
          size="sm"
          spacing={2}
          value={selected}
          onValueChange={(value) => setSelected(value as TopicSlug[])}
          className="mt-5 flex flex-wrap justify-start"
          aria-label="Topic filters"
        >
          {TOPICS.map((topic) => (
            <ToggleGroupItem
              key={topic}
              value={topic}
              className="rounded-md border-border/70 text-muted-foreground data-[state=on]:border-brand data-[state=on]:bg-brand data-[state=on]:text-brand-foreground data-[state=on]:hover:bg-brand"
            >
              {TOPIC_LABELS[topic]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="meta-text mt-4 flex flex-wrap gap-x-3 gap-y-1">
          <span>Topic archives:</span>
          {TOPICS.map((topic) => (
            <Link key={topic} href={`/topic/${topic}/`} className="text-link">
              {TOPIC_LABELS[topic]}
            </Link>
          ))}
        </p>
      </div>

      <hr className="soft-rule" />

      <div>
        {filtered.map((edition, index) => (
          <article key={edition.week}>
            {index > 0 ? <hr className="soft-rule" /> : null}
            <div className="py-7">
              <p className="section-kicker">{edition.period ?? edition.week}</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                <Link
                  href={`/week/${edition.week}/`}
                  className="headline-link"
                >
                  Week of {edition.week.replace("week-of-", "")}
                </Link>
              </h3>
              {edition.coverage ? (
                <p className="meta-text mt-2">{edition.coverage}</p>
              ) : null}
              <ul className="story-list mt-4 space-y-2">
                {previews(edition).map((item) => (
                  <li key={item.key} className="leading-snug">
                    {item.kicker ? (
                      <span className="meta-text mr-2">{item.kicker}</span>
                    ) : null}
                    {item.external ? (
                      <a
                        href={item.href}
                        className="headline-link text-sm font-medium sm:text-[0.95rem]"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.title}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="headline-link text-sm font-medium sm:text-[0.95rem]"
                      >
                        {item.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/week/${edition.week}/`}>Read the edition</Link>
                </Button>
                {edition.topics.map((topic) => (
                  <Button key={topic.topic} variant="ghost" size="sm" asChild>
                    <Link href={`/topic/${topic.topic}/${edition.week}/`}>
                      {topic.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No editions match the selected topics yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
