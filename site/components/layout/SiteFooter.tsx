import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SubscribeMenu } from "@/components/SubscribeMenu";
import { githubUrl, portfolioUrl } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer id="subscribe" className="border-t bg-card">
      <div className="wide-shell flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/">
            <BrandLogo className="h-10 w-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">
            A project by <a href={portfolioUrl} className="text-link">cyborgoat</a>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a href={githubUrl} className="text-link inline-flex items-center gap-1">
            GitHub <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
          <SubscribeMenu />
        </div>
      </div>
    </footer>
  );
}
