"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NavigationMenu } from "radix-ui";
import { BrandLogo } from "@/components/BrandLogo";
import { SocialLinks } from "@/components/SocialLinks";
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
import { TOPICS, TOPIC_LABELS } from "@/lib/site";

const topics = TOPICS.map((topic) => ({
  label: TOPIC_LABELS[topic],
  href: `/topic/${topic}/`,
}));

const home = { label: "Home", href: "/" };

export function SiteHeader() {
  const pathname = usePathname();

  function currentSection(href: string) {
    if (pathname === href || `${pathname}/` === href) return "page";
    if (href !== home.href && pathname.startsWith(href)) {
      return "location";
    }
    return undefined;
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:bg-background focus:p-3"
      >
        Skip to content
      </a>
      <div className="wide-shell flex min-h-14 items-center justify-between gap-2 lg:gap-6">
        <Link href="/" className="shrink-0">
          <BrandLogo className="h-8 w-auto sm:h-10" priority />
        </Link>

        <NavigationMenu.Root aria-label="Sections" className="hidden lg:block">
          <NavigationMenu.List className="flex items-center gap-5 xl:gap-7">
            {[home, ...topics].map(({ label, href }) => {
              const current = currentSection(href);
              return (
                <NavigationMenu.Item key={href}>
                  <NavigationMenu.Link asChild active={Boolean(current)}>
                    <Link
                      href={href}
                      aria-current={current}
                      className="block border-b-2 border-transparent py-4 text-sm font-semibold hover:text-brand data-[active]:border-brand data-[active]:text-brand"
                    >
                      {label}
                    </Link>
                  </NavigationMenu.Link>
                </NavigationMenu.Item>
              );
            })}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <div className="flex items-center gap-1">
          <Link
            href={home.href}
            aria-current={currentSection(home.href)}
            className="px-2 py-2 text-sm font-semibold hover:text-brand aria-[current]:text-brand lg:hidden"
          >
            {home.label}
          </Link>
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Browse topics">
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent aria-describedby={undefined}>
                <SheetHeader className="border-b">
                  <SheetTitle>Topics</SheetTitle>
                </SheetHeader>
                <nav aria-label="Topics" className="grid gap-1 px-4">
                  {topics.map(({ label, href }) => (
                    <SheetClose key={href} asChild>
                      <Link
                        href={href}
                        aria-current={currentSection(href)}
                        className="rounded-sm px-3 py-2 text-sm font-semibold hover:bg-accent aria-[current]:bg-accent aria-[current]:text-brand"
                      >
                        {label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
          <SocialLinks />
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
}
