# Maintaining Weekly Frontier

Run commands from the repository root.

## Setup

Use Python 3.12 or newer. Create a virtual environment with `python3 -m venv .venv`, activate it with `source .venv/bin/activate`, then install `pip install -r requirements.txt`. Copy `.env.example` for reference; variables must be exported (dotenv files are not loaded). Set `LLM_API_KEY`, `LLM_MODEL`, and `LLM_BASE_URL`. Never commit credentials.

In GitHub, configure secrets `LLM_API_KEY` and `LLM_BASE_URL`, and repository variable `LLM_MODEL`. The workflow also accepts the base URL as a variable and the model as a secret. Enable Actions permissions to write repository content and create pull requests. Daily archives and briefing changes go through review PRs rather than direct pushes to the default branch.

## Commands

```sh
python scripts/frontier.py collect --dry-run
python scripts/frontier.py daily --dry-run
python scripts/frontier.py daily --date 2026-11-18
python scripts/frontier.py generate --week-of 2026-11-16 --date 2026-11-18 --dry-run
python -m unittest discover -s tests
```

`collect` archives feed records only. `daily` collects new records and updates the current week's topic briefings. `generate --week-of` curates eligible archived records for a specified reporting week, defaulting to the previous week. `--date` specifies the collection/coverage date in Los Angeles time; polling always reads current feeds and cannot reconstruct expired history. Future publication timestamps are excluded.

Each topic briefing contains up to 20 stories for the whole reporting week. The model ranks articles for relevance, impact, and strength of evidence, and is instructed to choose one source per event. A new article can displace an earlier pick. Retained stories keep their summaries, citations, and reviewer edits. The model summarizes new selections from their archived excerpts.

A `data/editions/week-of-YYYY-MM-DD.json` checkpoint tracks the candidate URLs per topic, the coverage date, and whether the reporting period has ended. Reruns with the same candidate URLs reuse the published selection. `--regenerate` forces a fresh ranking, including previously unselected articles and existing stories.

Generation validates every topic before writing reader-facing pages and checkpoints. Raw archives may remain after generation failure, allowing a local retry without losing collected records. Dry runs write nothing, but fetch feeds and may call the model. Local commands operate on the current checkout; they do not query GitHub review state or publish PRs.

## Schedule and review lifecycle

The News archive workflow runs at **10:30 America/Los_Angeles daily** to collect feeds and update the current Monday–Sunday briefing. Split UTC cron entries plus a delay-tolerant local gate cover PST/PDT and late GitHub starts (through 18:00 Los Angeles time) without turning into successful no-ops. These are target times, not real-time guarantees.

There is one open review PR per reporting week. Its branch begins `news/week-of-YYYY-MM-DD-update-<first-update-date>`. Daily runs resume that PR from its latest head, merge the selected base branch, and refresh the weekly selection. Reviewer commits are preserved, and the workflow never force-pushes. A merge conflict or concurrent reviewer push fails safely; resolve conflicts on the review branch and rerun.

**Merging before the week ends is supported.** It publishes the coverage accumulated so far. The next day's run starts from the merged pages and opens a fresh update PR for the same reporting week. A same-day rerun after merging does not recreate that update. A rejected PR is not silently resurrected; reopen the latest rejected weekly review to resume updates.

Weekly Markdown stays at `weekly/<year>/week-of-YYYY-MM-DD.md` and `topics/<topic>/<year>/week-of-YYYY-MM-DD.md`. Current-week pages show a coverage date and an in-progress notice. Navigation points to the latest available reporting week.

At **11:30 daily**, the workflow checks the previous reporting week. From Monday onward it can consider Sunday stories captured by later polling and mark the reporting period as ended. It reads pending archive records as well as merged records, so Monday's current-week PR does not need to merge before Sunday stories can be summarized. Each source URL appears at most once per topic briefing. The final pass updates the same weekly pages.

Manual dispatch supports `daily` or `generate`, an optional collection/coverage date, and an optional Monday date. It runs the selected branch and targets content PRs to that branch, allowing feature-branch testing before merging. Scheduled runs use the default branch. Local `daily` always targets its date's current week; workflow dispatch also accepts an explicit week override.

Orchestration lives in `scripts/news_workflow.py` and uses the runner's Git and GitHub CLI. It reads pending archives for deduplication, collects, then checks out the open review head before modifying content. A pushed branch without a PR, for example after an API failure, can be recovered by opening its PR manually. Do not run orchestration from an untrusted checkout with publishing credentials.

GitHub's workflow token does not trigger additional workflows when it opens or updates a PR. The news job therefore runs tests and builds publication feeds before pushing. Human-created or updated content PRs also trigger Publish feeds validation. Publication occurs only after merging to main.

## Sources and editorial policy

Edit `config/sources.yaml` to add feeds. The current **35 source feeds** cover AI research and tooling alongside technology, world affairs, economics, science, and business. AI adds Google AI, Ahead of AI, Last Week in AI, Simon Willison, and MIT News AI to the existing papers, labs, and tooling sources. World-affairs sources include BBC World, Deutsche Welle, Al Jazeera, Bloomberg, and WSJ. Finance combines central-bank publications with economic and market reporting. Business includes BBC, Financial Times Companies, Fortune, Business Insider, and WSJ; business entries also supply finance candidates. See the [source curation notes](sources.md) for selection rationale and feed checks, including blocked, stale, and title-only feeds.

Every eligible article enters the ranking pool. The model reviews batches of up to 40 articles, with a title and excerpt for each, and ranks the combined shortlist until it has at most 20 picks. Eligibility still requires an in-week publication date and enough feed text to support a source-linked summary.

Summaries use publisher-supplied feed text, capped at 12,000 characters per item. Prefer usable summaries; fall back to embedded RSS/Atom content when a summary is missing or too short. Linked webpages are not fetched, and title-only items remain ineligible. This applies to newly collected records; previously archived empty excerpts are not automatically backfilled. Daily polling cannot guarantee completeness. Attribute disputed claims and lab claims, identify preprints as unreviewed, and treat significance as analysis. Human review is required before merging. Model generation does not independently fact-check stories; invalid responses fail the run instead of being silently repaired.

Feed requests use a 60-second timeout. Model calls use a 10-second connection timeout and configurable `llm_timeout_seconds` read timeout (300 seconds by default). Transient request failures are retried up to three attempts. Collection and topic-generation progress appear in workflow logs. The successful incremental-workflow test collected all 17 sources configured at that time and generated the weekly briefings; subsequent source changes need their own feed checks.

## Magazine site and publication feeds

The public magazine UI is a Next.js static site in `site/`, styled to match [cyborgoat.github.io](https://github.com/cyborgoat/cyborgoat.github.io) (Geist fonts, shared CSS tokens, light/dark theme). It reads committed Markdown under `weekly/` and `topics/` at build time.

```sh
cd site
npm ci
npm run build
cd ..
python scripts/publish_feeds.py --output site/out
```

`npm run build` writes `site/out`. `publish_feeds.py` merges the original 14 Atom/RSS files into that folder and does not overwrite an existing `index.html` (the Next homepage owns it). Use `--base-url` to override the public URL. Full Git history preserves the first publication timestamp and latest update timestamp. Stable entry IDs survive daily changes and corrections. Topic feed entries link to the website briefings. All-topics feed entries link to the corresponding weekly archive in the repository.

Feeds retain the latest 52 editions per stream: `feed.xml`, `feed.rss.xml`, `feeds/<topic>.xml`, and `feeds/<topic>.rss.xml`. Topic briefings are embedded in the main edition feed. Only generated public content is uploaded to Pages; raw archives, credentials, configuration, and logs are excluded. Existing historical feed URLs and entry IDs remain unchanged.

Enable Pages with GitHub Actions as the source. The Publish site workflow builds the Next app, merges feeds into `site/out`, and deploys that artifact. The public base URL is `https://www.cyborgoat.com/weekly-frontier/`, inherited from the account's Pages domain. Update subscription links, `site/lib/site.ts`, and the builder base URL together if hosting changes.
