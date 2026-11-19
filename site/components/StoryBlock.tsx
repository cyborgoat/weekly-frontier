import { Badge } from "@/components/ui/badge";
import type { Story } from "@/lib/content";

export function StoryBlock({
  story,
  showSeparator = true,
}: {
  story: Story;
  showSeparator?: boolean;
}) {
  const visibleTags = story.tags.slice(0, 3);
  const extraTags = Math.max(0, story.tags.length - visibleTags.length);

  return (
    <article>
      {showSeparator ? <hr className="soft-rule" /> : null}
      <div className="py-7">
        <h3 className="story-headline">
          {story.sourceUrl ? (
            <a
              href={story.sourceUrl}
              className="headline-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {story.title}
            </a>
          ) : (
            story.title
          )}
        </h3>
        {story.published ? (
          <p className="meta-text mt-2">Published {story.published}</p>
        ) : null}
        {story.summary ? (
          <p className="mt-3 max-w-3xl text-[0.975rem] leading-relaxed text-foreground/90">
            {story.summary}
          </p>
        ) : null}
        {story.whyItMatters ? (
          <p className="why-matters">
            <span className="font-medium text-foreground">Why it matters:</span>{" "}
            {story.whyItMatters}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {story.sourceLabel && story.sourceUrl ? (
            <a
              href={story.sourceUrl}
              className="text-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {story.sourceLabel}
            </a>
          ) : null}
          {visibleTags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-border/70 font-normal text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
          {extraTags > 0 ? (
            <span className="meta-text">+{extraTags}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
