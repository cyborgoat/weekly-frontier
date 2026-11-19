import type { Story } from "@/lib/content";

export function StoryBlock({ story }: { story: Story }) {
  return (
    <article className="border-t border-rule py-6 first:border-t-0 first:pt-0">
      <h3 className="story-headline">
        {story.sourceUrl ? (
          <a
            href={story.sourceUrl}
            className="hover:text-brand"
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
        <p className="mt-3 text-[0.975rem] leading-relaxed text-foreground/90">
          {story.summary}
        </p>
      ) : null}
      {story.whyItMatters ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Why it matters:</span>{" "}
          {story.whyItMatters}
        </p>
      ) : null}
      <div className="meta-text mt-4 flex flex-wrap gap-x-3 gap-y-1">
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
        {story.tags.length > 0 ? <span>{story.tags.join(" · ")}</span> : null}
      </div>
    </article>
  );
}
