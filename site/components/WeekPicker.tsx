"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TopicBriefing } from "@/lib/content";
import type { TopicSlug } from "@/lib/site";

export function WeekPicker({ weeks, current = "", topic }: {
  weeks: Pick<TopicBriefing, "week" | "period">[];
  current?: string;
  topic: TopicSlug;
}) {
  const router = useRouter();
  if (weeks.length < 2) return null;

  return (
    <Select value={current} onValueChange={(week) => router.push(`/topic/${topic}/${week}/`)}>
      <SelectTrigger aria-label="Reporting week">
        <CalendarDays aria-hidden="true" className="size-4 text-muted-foreground" />
        <SelectValue placeholder="Choose a week">
          {current ? weeks.find(({ week }) => week === current)?.period ?? current.replace("week-of-", "Week of ") : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {weeks.map(({ week, period }) => (
          <SelectItem key={week} value={week}>
            {period ?? week.replace("week-of-", "Week of ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
