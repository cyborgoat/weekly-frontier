"use client";

import { useRouter } from "next/navigation";

export function WeekPicker({ weeks, current, root }: {
  weeks: string[];
  current: string;
  root: string;
}) {
  const router = useRouter();
  if (weeks.length < 2) return null;
  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      Week of
      <select value={current} onChange={event => router.push(`${root}/${event.target.value}/`)}
        className="rounded-sm border bg-card p-2 text-foreground">
        {weeks.map(week => <option key={week} value={week}>{week.replace("week-of-", "")}</option>)}
      </select>
    </label>
  );
}
