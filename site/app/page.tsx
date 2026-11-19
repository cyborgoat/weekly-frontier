import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { SubscribePanel } from "@/components/SubscribePanel";
import { TopicFilter } from "@/components/TopicFilter";
import { Button } from "@/components/ui/button";
import { listEditions } from "@/lib/content";

export default function HomePage() {
  const editions = listEditions();
  const latest = editions[0] ?? null;

  return (
    <div className="page-spacing">
      <section className="wide-shell hero-in">
        <div className="relative overflow-hidden border-b border-rule pb-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse at 15% 10%, color-mix(in oklab, var(--brand) 18%, transparent), transparent 55%), linear-gradient(180deg, color-mix(in oklab, var(--secondary) 55%, transparent), transparent 70%)",
            }}
          />
          <div className="relative max-w-3xl">
            <BrandLogo className="h-auto w-full max-w-xl" priority />
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Concise, source-linked briefings on AI, technology, politics,
              finance, science, and business — organized by week, readable like a
              magazine.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="brand" asChild>
                <Link href="/#subscribe">Subscribe via RSS</Link>
              </Button>
              {latest ? (
                <Button variant="outline" asChild>
                  <Link href={`/week/${latest.week}/`}>Latest edition</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {latest ? (
        <section className="wide-shell home-reveal mt-12 border-b border-rule pb-12">
          <p className="meta-text">Latest edition</p>
          <h2 className="lead-headline mt-2 max-w-4xl">
            <Link href={`/week/${latest.week}/`} className="hover:text-brand">
              {latest.period ?? latest.week}
            </Link>
          </h2>
          {latest.coverage ? (
            <p className="meta-text mt-3">{latest.coverage}</p>
          ) : null}
          <ol className="story-list-numbered mt-8 max-w-3xl space-y-4">
            {latest.highlights.map((highlight, index) => (
              <li key={`${highlight.url}-${index}`}>
                <a
                  href={highlight.url}
                  className="text-xl font-semibold tracking-tight hover:text-brand sm:text-2xl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {highlight.title}
                </a>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Link href={`/week/${latest.week}/`} className="text-link">
              Open the full edition
            </Link>
          </div>
        </section>
      ) : (
        <section className="wide-shell mt-12">
          <p className="text-muted-foreground">No editions published yet.</p>
        </section>
      )}

      <section className="wide-shell home-reveal mt-12">
        <TopicFilter editions={editions} />
      </section>

      <div className="wide-shell mt-16">
        <SubscribePanel />
      </div>
    </div>
  );
}
