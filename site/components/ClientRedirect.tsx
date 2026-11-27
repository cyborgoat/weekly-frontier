"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ClientRedirect({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(href);
  }, [href, router]);

  return (
    <p className="page-spacing magazine-shell text-muted-foreground">
      Taking you to the latest briefing…
    </p>
  );
}
