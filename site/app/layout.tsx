import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { topicHref } from "@/lib/content";
import { siteUrl, TOPIC_LABELS, TOPICS } from "@/lib/site";

const description =
  "A weekly reading companion covering AI, technology, politics, finance, science, and business — concise, source-linked briefings with Atom and RSS subscriptions.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Weekly Frontier",
    template: "%s · Weekly Frontier",
  },
  description,
  alternates: {
    types: {
      "application/atom+xml": `${siteUrl}/feed.xml`,
      "application/rss+xml": `${siteUrl}/feed.rss.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "Weekly Frontier",
    description,
    siteName: "Weekly Frontier",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const topics = TOPICS.map((topic) => ({
    topic,
    label: TOPIC_LABELS[topic],
    href: topicHref(topic),
  }));

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="site-atmosphere flex min-h-screen flex-col bg-background font-sans antialiased">
        <ThemeProvider>
          <SiteHeader topics={topics} />
          <main id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
