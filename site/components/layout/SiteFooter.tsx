import Link from "next/link";
import { githubUrl, portfolioUrl, siteUrl } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-rule">
      <div className="wide-shell flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="meta-text">
          Weekly Frontier · a project by{" "}
          <a href={portfolioUrl} className="text-link">
            cyborgoat
          </a>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/#subscribe" className="text-link">
            Subscribe
          </Link>
          <a href={`${siteUrl}/feed.xml`} className="text-link">
            Atom
          </a>
          <a href={`${siteUrl}/feed.rss.xml`} className="text-link">
            RSS
          </a>
          <a
            href={githubUrl}
            className="text-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
