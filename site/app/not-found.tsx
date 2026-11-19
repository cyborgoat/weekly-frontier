import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-spacing">
      <div className="magazine-shell">
        <p className="section-kicker">404</p>
        <h1 className="page-title mt-2">Page not found</h1>
        <p className="mt-4 text-muted-foreground">
          That edition or topic is not available.
        </p>
        <hr className="soft-rule my-8" />
        <Button variant="brand" asChild>
          <Link href="/">Back to Weekly Frontier</Link>
        </Button>
      </div>
    </div>
  );
}
