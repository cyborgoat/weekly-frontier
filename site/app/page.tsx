import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { SubscribePanel } from "@/components/SubscribePanel";
import { TopicFilter } from "@/components/TopicFilter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listEditions } from "@/lib/content";

export default function HomePage() {
  const editions = listEditions();
  const latest = editions[0] ?? null;
  const [lead, ...restHighlights] = latest?.highlights ?? [];
  const inProgress = Boolean(
    latest?.coverage?.toLowerCase().includes("in progress"),
  );

  return (
    <div className="page-spacing">
      <section className="wide-shell hero-in">
        <div className="hero-panel">
          <div className="max-w-3xl">
            <BrandLogo className="h-auto w-full max-w-[min(100%,36rem)]" priority />
            <p className="mt-5 max-w-xl text-[0.975rem] leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
              Concise, source-linked briefings on AI, technology, politics,
              finance, science, and business — organized by week, readable like a
              magazine.
            </p>
            <div className="hero-actions mt-7 sm:mt-8">
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
        <section
          id="latest"
          className="wide-shell home-reveal section-gap scroll-mt-24"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="section-kicker">Latest edition</p>
            {inProgress ? (
              <Badge variant="secondary">In progress</Badge>
            ) : null}
          </div>
          <h2 className="lead-headline mt-3">
            <Link
              href={`/week/${latest.week}/`}
              className="headline-link"
            >
              {latest.period ?? latest.week}
            </Link>
          </h2>
          {latest.coverage ? (
            <p className="meta-text mt-3">{latest.coverage}</p>
          ) : null}

          <hr className="soft-rule my-10" />

          {lead ? (
            <div className="max-w-3xl">
              <p className="section-kicker">Lead</p>
              <a
                href={lead.url}
                className="headline-link mt-3 block text-2xl font-semibold tracking-tight sm:text-[1.85rem] sm:leading-snug"
                target="_blank"
                rel="noopener noreferrer"
              >
                {lead.title}
              </a>
            </div>
          ) : null}

          {restHighlights.length > 0 ? (
            <ol className="highlight-rail mt-10">
              {restHighlights.map((highlight, index) => (
                <li key={`${highlight.url}-${index}`}>
                  <p className="section-kicker mb-2">
                    {String(index + 2).padStart(2, "0")}
                  </p>
                  <a
                    href={highlight.url}
                    className="headline-link text-[1.05rem] font-semibold tracking-tight sm:text-lg"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {highlight.title}
                  </a>
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mt-10">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/week/${latest.week}/`}>Open the full edition</Link>
            </Button>
          </div>
          <hr className="soft-rule mt-14" />
        </section>
      ) : (
        <section className="wide-shell section-gap">
          <p className="text-muted-foreground">No editions published yet.</p>
        </section>
      )}

      <section
        id="browse"
        className="wide-shell home-reveal section-gap scroll-mt-24"
      >
        <TopicFilter editions={editions} />
      </section>

      <div className="wide-shell section-gap">
        <SubscribePanel />
      </div>
    </div>
  );
}
