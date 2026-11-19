import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-spacing">
      <div className="magazine-shell">
        <h1 className="page-title">Page not found</h1>
        <p className="mt-4 text-muted-foreground">
          That edition or topic is not available.
        </p>
        <Link href="/" className="text-link mt-6 inline-block">
          Back to Weekly Frontier
        </Link>
      </div>
    </div>
  );
}
