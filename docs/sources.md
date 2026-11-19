# Source curation

Use Feeder's editorial lists to discover candidates, then validate and collect publisher feeds directly. Feeder is a discovery reference, not a runtime dependency. Follower counts alone do not determine inclusion.

Discovery references: [world news](https://feeder.co/discover/the-best-news-feeds), [finance](https://feeder.co/discover/finance), and [business](https://feeder.co/discover/top-business-news-2019).

The current configuration has **35 feeds**: twelve AI, five technology, five politics, six finance, two science, and five business. Daily story-selection limits and the incremental weekly publication workflow are unchanged.

## First curation pass — November 19, 2026

This pass focused on politics, finance, and business, bringing the list to 21 feeds: seven AI, three technology, three politics, three finance, two science, and three business. The daily selection limit remains eight new stories per topic; weekly pages continue to grow incrementally.

| Topic | Selected feeds | Rationale |
| --- | --- | --- |
| Politics | BBC World, Deutsche Welle World, Al Jazeera English | Three publishers based in different regions, with dated world-affairs coverage and usable excerpts. Replace the second BBC feed, UK Politics, to reduce reliance on one publisher. |
| Finance | Federal Reserve monetary policy, ECB publications, Guardian Economics | Combine primary central-bank publications with economic reporting. Keep the narrower Fed feed; use the Guardian's economics section rather than a general-news stream. |
| Business | BBC Business, Financial Times Companies, Fortune | Combine broad business reporting with company coverage from additional publishers. Use FT's companies section rather than its general homepage feed. |

Technology, science, and the existing AI feeds are outside this first pass. Existing source IDs remain unchanged for retained feeds, preserving archive attribution. Removed sources remain identifiable in historical archives and previously published pages.

## Publisher-feed checks

Checks fetched each feed directly, parsed it with the app's feed parser, and inspected up to 50 entries. An entry counted as usable when it had a publication/update timestamp and a summary longer than 80 characters after the same HTML-tag stripping used by the collector. All selected additions had entries dated November 18 or 19 UTC. These are point-in-time checks from the local environment, not guarantees of continued availability or GitHub-runner access.

| Selected addition | Usable / sampled | Feed |
| --- | --- | --- |
| Deutsche Welle World | 11 / 11 | `https://rss.dw.com/rdf/rss-en-world` |
| Al Jazeera English | 24 / 25 | `https://www.aljazeera.com/xml/rss/all.xml` |
| European Central Bank | 13 / 15 | `https://www.ecb.europa.eu/rss/pub.html` |
| Guardian Economics | 20 / 20 | `https://www.theguardian.com/business/economics/rss` |
| Financial Times Companies | 22 / 25 | `https://www.ft.com/companies?format=rss` |
| Fortune | 8 / 10 | `https://fortune.com/feed/` |

Other candidates were evaluated rather than automatically imported:

- CNBC Top News returned HTTP 403 and was not added.
- The Economist Business supplied usable excerpts for only 9 of 50 sampled entries, so it was not added.
- Guardian World supplied usable excerpts for all 45 entries, but remains an alternative to keep the politics set small and spread across publisher locations.
- The FT homepage supplied usable excerpts for 10 of 11 entries; its companies section was chosen for a closer business fit.
- Axios's general feed supplied usable excerpts for all 50 sampled entries, but its mixed political content was a weaker business fit than the selected feeds.

Paywalled sources still contribute only their publicly supplied feed excerpts. Selection does not fetch full articles or bypass publisher access controls. World-news streams can contain nonpolitical items; the model selects significant relevant developments during editorial generation.

## Publisher URLs supplied by the maintainer — November 19, 2026

Checked the supplied Bloomberg, Business Insider, and current Dow Jones public endpoints directly. All nine additions below supplied entries dated November 19 UTC. The final column counts sampled entries that also passed the excerpt/date/link checks and were published within the preceding 14 days. WSJ Technology included two additional usable but older entries (29 usable in total).

| Added feed | Topic | Recent usable / sampled |
| --- | --- | --- |
| [Bloomberg Markets](https://www.bloomberg.com/feeds/markets/news.rss) | Finance | 20 / 20 |
| [Bloomberg Economics](https://www.bloomberg.com/feeds/economics/news.rss) | Finance | 19 / 20 |
| [Bloomberg Technology](https://www.bloomberg.com/feeds/technology/news.rss) | Technology | 20 / 20 |
| [Bloomberg Politics](https://www.bloomberg.com/feeds/politics/news.rss) | Politics | 18 / 20 |
| [Business Insider](https://www.businessinsider.com/rss) | Business | 20 / 20 |
| [WSJ US Business](https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness) | Business | 39 / 50 |
| [WSJ Markets](https://feeds.content.dowjones.io/public/rss/RSSMarketsMain) | Finance | 42 / 50 |
| [WSJ World News](https://feeds.content.dowjones.io/public/rss/RSSWorldNews) | Politics | 46 / 50 |
| [WSJ Technology](https://feeds.content.dowjones.io/public/rss/RSSWSJD) | Technology | 27 / 40 |

Business Insider's supplied URL redirected to `https://feeds.businessinsider.com/custom/all`. The configuration retains the supplied publisher URL and follows its redirect. The Bloomberg feeds are fetched directly, without Google News intermediaries or commercial machine-readable feeds.

[Bloomberg Business](https://www.bloomberg.com/feeds/business/news.rss) returned 20 dated entries, but none had summaries exceeding the app's 80-character threshold, so it was not enabled. [Bloomberg Opinion](https://www.bloomberg.com/feeds/bview/news.rss) and [WSJ Opinion](https://feeds.content.dowjones.io/public/rss/RSSOpinion) were reachable, with 15/18 and 23/50 usable entries respectively. They remain outside the news selection; introducing opinion coverage would require explicit presentation as commentary.

These successful checks apply to the current `feeds.content.dowjones.io` URLs, rather than legacy WSJ feed addresses. As with the first pass, access was tested locally; GitHub-runner availability still depends on publisher access policies.

## AI research, official labs, and independent blogs — November 19, 2026

OpenAI News, Hugging Face, and arXiv were already configured. Keep the existing arXiv combined feed (cs.AI, cs.LG, cs.CL, cs.CV, and stat.ML) rather than duplicating cs.AI. Google Research and DeepMind also remain configured; Google's AI topic feed adds product and policy coverage from its main blog.

The new additions were checked against the actual collector's text extraction. Prefer a summary longer than 80 characters; if it is absent or too short, use text embedded in the RSS/Atom content field, capped at the existing 12,000 characters per item. This reads only the downloaded feed and never requests the linked article. Earlier validation tables above record the summary-only checks used at that time.

| Added feed | Role | Usable / sampled | Usable within 45 days |
| --- | --- | --- | --- |
| [Google AI Blog](https://blog.google/innovation-and-ai/technology/ai/rss/) | Official research/product announcements | 17 / 20 | 15 |
| [Ahead of AI](https://magazine.sebastianraschka.com/feed) | Independent LLM architecture and training analysis | 20 / 20 | 2 |
| [Last Week in AI](https://lastweekin.ai/feed) | Periodic news and research roundups | 20 / 20 | 2 |
| [Simon Willison](https://simonwillison.net/atom/everything/) | Hands-on LLM and developer notes | 30 / 30 | 30 |

Google's older AI RSS URL redirects to the configured `innovation-and-ai` path. Sebastian Raschka's homepage links to Ahead of AI and a site-wide RSS feed; the site-wide endpoint returned HTTP 406 locally, while the newsletter feed worked. Embedded feed content makes Ahead of AI's latest article usable despite its short subtitle. Slow publication schedules are intentional for research newsletters; weekly eligibility still uses each post's actual publication date.

Also added [MIT News — Artificial intelligence](https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml), linked directly from [MIT's official RSS directory](https://news.mit.edu/rss). All 50 sampled entries had dated, usable text; the newest was November 18, 2026 at 19:00 UTC. This topic-specific feed covers MIT's own research and announcements without importing general campus news. It is a primary institutional source, distinct from MIT Technology Review's independent reporting; university claims still require attribution.

Existing-feed checks and candidates not enabled:

- [OpenAI News](https://openai.com/news/rss.xml): 49 of 50 sampled entries supplied usable summaries; no duplicate source was added.
- [Hugging Face](https://huggingface.co/blog/feed.xml): the latest 50 sampled entries contained titles, links, and dates, but neither summaries nor embedded content. Keep this existing source for metadata archiving; title-only entries are excluded from generated briefings. Previously archived empty excerpts are not automatically backfilled by the extraction change.
- [The Gradient essays](https://thegradient.pub/rss/) and [newsletter](https://thegradientpub.substack.com/feed): newest posts were February 18 and 19, 2026 respectively, with no posts in the 45-day freshness window. Keep them on the review list for future activity rather than enabling stale archives for weekly coverage.
- [MIT Technology Review AI](https://www.technologyreview.com/topic/artificial-intelligence/feed) and [The Verge AI](https://www.theverge.com/rss/ai-artificial-intelligence/index.xml): both returned HTTP 403 locally and were not enabled. Publisher access policies may differ across environments.

Official announcements are publisher claims; independent analyses and roundups are secondary interpretation, not independently confirmed primary research. Maintain attribution and check duplicate events across lab posts, papers, newsletters, and news reporting. These checks validate dates, text availability, and access, not factual accuracy.

Discovery references: the publishers' own sites, [Sebastian Raschka's homepage](https://sebastianraschka.com/), [Google's AI page](https://blog.google/innovation-and-ai/technology/ai/), and [Feeder's AI list](https://feeder.co/discover/ai).

## Ongoing review

Review collection diagnostics and published selections for persistent errors, stale feeds, short excerpts, duplicate coverage, topic fit, and publisher concentration. Replace sources that add little distinct coverage. Candidate rotation is per feed rather than per publisher, so category feeds from one newsroom can receive multiple rotation slots. Keep a mix of primary announcements and independent reporting, and attribute claims rather than treating feed inclusion as verification.

When changing a feed, fetch it directly and check recent dates and usable summaries before enabling it. Record the reason for additions or removals here. A feed that succeeds locally can still be blocked from a GitHub-hosted runner; use workflow collection reports to check that separately.
