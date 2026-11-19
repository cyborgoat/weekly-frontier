import { Badge } from "@/components/ui/badge";
import { feedUrl, TOPIC_LABELS, TOPICS } from "@/lib/site";

const feeds = [
  { title: "All topics", atom: feedUrl("feed"), rss: feedUrl("feed.rss") },
  ...TOPICS.map((topic) => ({
    title: TOPIC_LABELS[topic],
    atom: feedUrl(`feeds/${topic}`),
    rss: feedUrl(`feeds/${topic}.rss`),
  })),
];

export function SubscribePanel() {
  return (
    <section
      id="subscribe"
      className="scroll-mt-24"
      aria-labelledby="subscribe-heading"
    >
      <hr className="soft-rule mb-10" />
      <p className="section-kicker">Feeds</p>
      <h2 id="subscribe-heading" className="section-title mt-2">
        Subscribe
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Copy a feed link into your reader. Each week keeps a stable entry; content
        and the update timestamp change as daily coverage is reviewed and merged.
      </p>
      <ul className="mt-6 grid gap-0 sm:grid-cols-2 sm:gap-x-10">
        {feeds.map((feed) => (
          <li key={feed.title} className="py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{feed.title}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  asChild
                  variant="outline"
                  className="border-border/70 font-normal text-muted-foreground"
                >
                  <a href={feed.atom}>Atom</a>
                </Badge>
                <Badge asChild variant="ghost" className="font-normal text-muted-foreground">
                  <a href={feed.rss}>RSS</a>
                </Badge>
              </div>
            </div>
            <hr className="soft-rule mt-2.5" />
          </li>
        ))}
      </ul>
    </section>
  );
}
