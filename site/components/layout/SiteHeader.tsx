import Image from "next/image";
import Link from "next/link";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Button } from "@/components/ui/button";
import { portfolioUrl } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-background/95 backdrop-blur-sm">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:bg-background focus:p-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="wide-shell flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <Image
              src="/brand/weekly-frontier-logo.png"
              alt="Weekly Frontier"
              width={160}
              height={53}
              className="h-7 w-auto dark:hidden"
              priority
            />
            <Image
              src="/brand/weekly-frontier-logo-dark.png"
              alt="Weekly Frontier"
              width={160}
              height={53}
              className="hidden h-7 w-auto dark:block"
              priority
            />
          </Link>
          <span className="hidden text-muted-foreground sm:inline" aria-hidden>
            /
          </span>
          <a
            href={portfolioUrl}
            className="meta-text hidden hover:text-foreground sm:inline"
          >
            cyborgoat
          </a>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/#subscribe">Subscribe</Link>
          </Button>
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
