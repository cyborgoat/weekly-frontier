"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StoryBlock } from "@/components/StoryBlock";
import type { Story } from "@/lib/content";

const sortOptions = [
  { value: "editorial", label: "Editorial order" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

export function BriefingStories({ stories }: { stories: Story[] }) {
  const [sort, setSort] = useState("editorial");
  const ordered = stories.map((story, index) => ({
    story,
    index,
    date: Date.parse(story.published ?? ""),
  }));

  if (sort !== "editorial") {
    ordered.sort((a, b) => {
      if (Number.isNaN(a.date)) return Number.isNaN(b.date) ? 0 : 1;
      if (Number.isNaN(b.date)) return -1;
      return sort === "newest" ? b.date - a.date : a.date - b.date;
    });
  }

  return (
    <section aria-labelledby="stories-heading" className="mt-10 border-t">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <h2 id="stories-heading" className="section-title">Stories</h2>
        {stories.length > 1 && (
          <div className="flex items-center gap-2">
            <span id="story-sort-label" className="text-sm text-muted-foreground">Sort by</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="min-w-36" aria-labelledby="story-sort-label">
                <SelectValue>{sortOptions.find(({ value }) => value === sort)?.label}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      {ordered.length === 0 && (
        <p className="py-6 text-sm text-muted-foreground">No stories in this briefing yet.</p>
      )}
      {ordered.map(({ story, index }, position) => (
        <StoryBlock key={index} story={story} showSeparator={position > 0} />
      ))}
    </section>
  );
}
