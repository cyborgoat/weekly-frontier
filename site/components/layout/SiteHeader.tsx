"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { portfolioUrl } from "@/lib/site";

const navLinks = [
  { href: "/#latest", label: "Latest" },
  { href: "/#browse", label: "Topics" },
  { href: "/#subscribe", label: "Subscribe" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-rule/60 bg-background/90 backdrop-blur-sm">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:bg-background focus:p-3"
        href="#main-content"
      >
        Skip to content
      </a>
      <div className="wide-shell flex h-14 items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <BrandLogo className="h-6 w-auto max-w-[9.5rem] sm:h-7 sm:max-w-none" priority />
          </Link>
          <span className="hidden text-muted-foreground/70 sm:inline" aria-hidden>
            /
          </span>
          <a
            href={portfolioUrl}
            className="meta-text hidden hover:text-foreground sm:inline"
          >
            cyborgoat
          </a>
        </div>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 md:flex"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-0.5 justify-self-end">
          <ThemeToggleButton />
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                aria-describedby={undefined}
                className="p-0 motion-reduce:animate-none motion-reduce:transition-none"
              >
                <SheetHeader className="border-b border-rule/60">
                  <SheetTitle className="meta-text text-left">Menu</SheetTitle>
                </SheetHeader>
                <nav aria-label="Main navigation" className="grid px-4">
                  {navLinks.map(({ href, label }) => (
                    <SheetClose key={href} asChild>
                      <Link
                        href={href}
                        className="border-b border-rule/50 py-4 text-lg font-medium"
                      >
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <a
                      href={portfolioUrl}
                      className="border-b border-rule/50 py-4 text-lg font-medium"
                    >
                      cyborgoat
                    </a>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
