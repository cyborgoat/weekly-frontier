import Link from "next/link";
import { Button } from "@/components/ui/button";
import { githubUrl, portfolioUrl, siteUrl } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer>
      <hr className="soft-rule" />
      <div className="wide-shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="meta-text">
          Weekly Frontier · a project by{" "}
          <a href={portfolioUrl} className="text-link">
            cyborgoat
          </a>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="border-border/70" asChild>
            <a href={`${siteUrl}/feed.xml`}>Atom</a>
          </Button>
          <Button variant="outline" size="sm" className="border-border/70" asChild>
            <a href={`${siteUrl}/feed.rss.xml`}>RSS</a>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#subscribe">Subscribe</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </Button>
        </nav>
      </div>
    </footer>
  );
}
