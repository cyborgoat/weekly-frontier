import { feedUrl, TOPIC_LABELS, TOPICS } from "@/lib/site";

export function SubscribePanel() {
  return (
    <section
      id="subscribe"
      className="border-t border-rule pt-10"
      aria-labelledby="subscribe-heading"
    >
      <h2 id="subscribe-heading" className="section-title">
        Subscribe
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Copy a feed link into your reader. Each week keeps a stable entry; content
        and the update timestamp change as daily coverage is reviewed and merged.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        <li className="border-b border-rule pb-3">
          <p className="font-medium">All topics</p>
          <p className="mt-1 flex flex-wrap gap-3">
            <a href={feedUrl("feed")} className="text-link">
              Atom
            </a>
            <a href={feedUrl("feed.rss")} className="text-link">
              RSS
            </a>
          </p>
        </li>
        {TOPICS.map((topic) => (
          <li key={topic} className="border-b border-rule pb-3">
            <p className="font-medium">{TOPIC_LABELS[topic]}</p>
            <p className="mt-1 flex flex-wrap gap-3">
              <a href={feedUrl(`feeds/${topic}`)} className="text-link">
                Atom
              </a>
              <a href={feedUrl(`feeds/${topic}.rss`)} className="text-link">
                RSS
              </a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
