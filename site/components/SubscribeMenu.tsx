"use client";

import { Atom, ChevronRight, Rss } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Button } from "@/components/ui/button";
import { feedUrl, TOPIC_LABELS, TOPICS } from "@/lib/site";

const feeds = [
  { label: "All topics", stem: "feed" },
  ...TOPICS.map((topic) => ({
    label: TOPIC_LABELS[topic],
    stem: `feeds/${topic}`,
  })),
];

const formats = [
  { label: "RSS", icon: Rss, suffix: ".rss" },
  { label: "Atom", icon: Atom, suffix: "" },
];

const panelClass = "z-50 min-w-36 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg";
const itemClass =
  "flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[state=open]:bg-accent";

export function SubscribeMenu({ side = "bottom" }: { side?: "top" | "bottom" }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="icon" aria-label="Subscribe">
          <Rss aria-hidden="true" className="size-[1.2rem] text-brand" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" side={side} sideOffset={8} collisionPadding={8} className={panelClass}>
          {formats.map(({ label, icon: Icon, suffix }) => (
            <DropdownMenu.Sub key={label}>
              <DropdownMenu.SubTrigger className={itemClass}>
                <Icon aria-hidden="true" className="size-4 text-brand" />
                {label}
                <ChevronRight aria-hidden="true" className="ml-auto size-3.5 text-muted-foreground" />
              </DropdownMenu.SubTrigger>
              <DropdownMenu.Portal>
                <DropdownMenu.SubContent sideOffset={4} collisionPadding={8} className={panelClass}>
                  {feeds.map(({ label: topic, stem }) => (
                    <DropdownMenu.Item key={stem} asChild className={itemClass}>
                      <a href={feedUrl(stem + suffix)} aria-label={`${topic} ${label} feed`}>
                        {topic}
                      </a>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Portal>
            </DropdownMenu.Sub>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
