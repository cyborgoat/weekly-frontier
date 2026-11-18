# Maintaining Weekly Frontier

Run commands from the repository root.

## Setup

Use Python 3.12 or newer. Create a virtual environment with `python3 -m venv .venv`, activate it with `source .venv/bin/activate`, then install `pip install -r requirements.txt`. Copy `.env.example` for reference; variables must be exported (dotenv files are not loaded). Set `LLM_API_KEY`, `LLM_MODEL`, and `LLM_BASE_URL`. Never commit credentials.

In GitHub, configure secrets `LLM_API_KEY` and `LLM_BASE_URL`, and repository variable `LLM_MODEL`. The workflow also accepts the base URL as a variable and the model as a secret. Enable Actions permissions to write repository content and create pull requests. All daily content and weekly editions go through review PRs; collection never pushes archives directly to the default branch.

## Commands

```sh
python scripts/frontier.py collect --dry-run
python scripts/frontier.py daily --dry-run
python scripts/frontier.py daily --date 2026-11-18
python scripts/frontier.py generate --week-of 2026-11-16 --dry-run
python scripts/frontier.py generate --week-of 2026-11-16
python -m unittest discover -s tests
```

`collect` archives feed records only. `daily` collects and generates up to eight articles per topic, dated indexes, and a completion manifest under `data/daily/`. `--date` names the collection batch; polling always reads current feeds and cannot reconstruct expired feed history. Invalid or future publication timestamps are excluded from article selection. A completed local date is preserved on rerun, including reviewer edits. After a failed attempt, rerun the same date to reuse archived records. Raw archives can remain after generation failure, but no article pages or completion manifest are written until every topic succeeds. Dry runs do not write files but still fetch feeds and may call the model.

Weekly generation synthesizes approved standalone articles, using source publication dates in Los Angeles time. `--regenerate` permits replacing existing local editions; review changes before committing. Local commands operate on the current checkout and do not query GitHub review state. Use the workflow for review-aware publication.

## Schedule and review lifecycle

The News archive workflow collects at **10:30 America/Los_Angeles daily**, and checks weekly generation at **11:30 daily**. UTC schedules cover PST and PDT; a local-hour gate skips the unused offset. GitHub schedules may be delayed; these are target times rather than real-time guarantees.

Each daily run opens `news/daily-YYYY-MM-DD`, containing raw records, diagnostics, selected articles, and dated indexes. Articles live at `articles/<topic>/<publication-year>/<zero-padded-month>/<stable-id>.md`. The directories follow the primary source publication date in Los Angeles time, while daily indexes follow the collection date. YAML front matter stores article identity, topic, collection date, source timestamps, source URLs, and tags.

Open daily PR archives and articles participate in URL deduplication and model-assisted event deduplication. Exact URLs are checked against the full archive; up to 80 existing articles, ranked by title overlap and recency, provide bounded context for skipping alternate URLs for the same event. This is editorial deduplication, not a guarantee that all differently worded duplicates will be recognized; reviewers should check it. Each date has separate index files to avoid shared-index conflicts between pending daily PRs.

Rerunning a date with an existing PR (open, merged, or rejected) leaves it intact. Edit that PR for corrections. To deliberately replace a rejected daily edition, restore its branch and reopen the original PR rather than expecting the scheduler to overwrite it. A pushed branch without a PR, for example after a GitHub API failure, can be recovered by opening its PR manually; the next run will then recognize it.

Weekly review begins on Monday for the previous Monday–Sunday. Relevant open daily PRs block generation, including Monday's collection, which may contain Sunday stories. Later daily PRs also block if their article metadata assigns coverage to that week. The following Monday's collection must exist or have a resolved daily PR before generation proceeds. A failed Monday collection therefore holds the edition until collection recovers.

Checks retry overdue weeks oldest first, including earlier reporting weeks identified by late-collected articles. The Monday-collection gate applies from rollout onward; older reporting weeks can be summarized with an incomplete-coverage note. Rejected daily PRs are excluded and noted as coverage limitations. A weekly PR awaiting review is preserved and holds newer weekly editions; a rejected weekly PR is not silently recreated. Only one new weekly PR is opened per run. Existing historical editions remain intact and are not converted to articles.

Manual dispatch supports `daily` with an optional collection date, or `generate` with an optional Monday date. It runs the selected branch and targets generated PRs to that branch, allowing a feature branch to be tested before merging. Scheduled runs use the default branch. Omitting the week retries overdue editions. To recover a delayed or failed collection, dispatch `daily` for its original collection date; lost feed history may not be recoverable. Workflow orchestration uses `scripts/news_workflow.py`, Git, and the GitHub CLI supplied by the runner. It reads pending PR snapshots without checking them out. Never run the orchestration script against an untrusted checkout with publishing credentials.

GitHub's workflow token does not trigger additional workflows when it opens a PR, so the news job runs tests and builds publication feeds before pushing its branch. Human-created or updated content PRs also trigger the Publish feeds checks. Publication occurs only after merging to main.

## Sources and editorial policy

Edit `config/sources.yaml` to add feeds. Seventeen feeds cover AI papers, research labs, tooling and commentary alongside BBC, TechCrunch, Ars Technica, Federal Reserve, Nature, and NASA. BBC Business also supplies finance candidates. Political coverage needs broader geographic and publisher diversity.

Summaries use feed excerpts, not full website articles. Daily polling cannot guarantee completeness. Disputed claims should be attributed; significance is analysis. Identify preprints as unreviewed and attribute lab claims. Human review is required before merging. The model does not independently fact-check stories.

Candidate selection balances sources, taking up to 80 AI candidates and 40 for other topics. `daily_stories_per_topic` and `stories_per_topic` in `config/settings.yaml` default to eight. This is a bounded selection, not an exhaustive survey. Invalid model responses fail generation instead of being silently repaired.

Feed requests use a 60-second timeout. Model calls use a separate 10-second connection timeout and configurable `llm_timeout_seconds` read timeout (300 seconds by default), allowing the model to finish longer editorial responses. Transient request failures are retried up to three attempts. Collection and topic-generation progress appear in workflow logs.

## Publication feeds

`python scripts/publish_feeds.py` builds Atom and RSS in `.cache/feed-site/`, using committed Markdown only. Use `--output` and `--base-url` to override the destination and public URL. Full Git history preserves publication/update timestamps. Stable entry IDs survive corrections. Only generated public content is uploaded to Pages; raw archives, credentials, configuration, and logs are excluded.

Existing weekly feeds retain their URLs, IDs, and latest 52 editions per stream: `feed.xml`, `feed.rss.xml`, `feeds/<topic>.xml`, and `feeds/<topic>.rss.xml`.

Separate article feeds retain the latest 200 articles per stream: `articles/feed.xml`, `articles/feed.rss.xml`, `feeds/articles/<topic>.xml`, and `feeds/articles/<topic>.rss.xml`. Article metadata is omitted from reader-facing feed content. Both kinds of feed link to GitHub Markdown pages and original sources. The subscription landing page lists all 28 Atom/RSS files.

Enable Pages with GitHub Actions as the source. The public base URL is `https://www.cyborgoat.com/weekly-frontier/`, inherited from the account's Pages domain. Update subscription links and the builder base URL together if hosting changes.
