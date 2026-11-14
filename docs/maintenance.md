# Maintaining Weekly Frontier

Run the commands below from the repository root.

## Setup

Use Python 3.12 or newer. Create a virtual environment with `python3 -m venv .venv`, activate it with `source .venv/bin/activate`, then install `pip install -r requirements.txt`. Copy `.env.example` for reference; environment variables must be exported in your shell (the script does not load dotenv files). Set `LLM_API_KEY`, `LLM_MODEL`, and `LLM_BASE_URL`. Never commit credentials.

In GitHub, set secrets `LLM_API_KEY` and `LLM_BASE_URL`, and repository variable `LLM_MODEL`. The workflow also accepts the base URL as a repository variable and the model as a secret. Enable Actions permissions to write repository content and create pull requests. Branch protections may require adapting daily archive publishing to your repository policy.

## Commands

```sh
python scripts/frontier.py collect --dry-run
python scripts/frontier.py collect
python scripts/frontier.py generate --week-of 2026-11-09 --dry-run
python scripts/frontier.py generate --week-of 2026-11-09
python -m unittest discover -s tests
```

Generation requires collected records and reports from the requested week. `--regenerate` permits replacing existing local digests. Review changes before committing. Daily runs archive feed text at 08:17 LA; Monday generation runs at 09:17 LA. GitHub schedules can be delayed. Manual workflow dispatch supports recovery; missed feed history cannot always be reconstructed.

## Source configuration and editorial policy

Edit `config/sources.yaml` to add feeds. Seventeen feeds cover AI papers, research labs, tooling and commentary alongside BBC, TechCrunch, Ars Technica, Federal Reserve, Nature, and NASA. BBC Business also supplies finance candidates. Political coverage needs broader geographic and publisher diversity.

Summaries use feed excerpts, not full website articles. Links identify original sources. Daily polling reduces missing stories but cannot guarantee completeness. Disputed claims should be attributed; significance is analysis. Human review is required before merging.

## Current limitations

The initial implementation selects recent candidates and asks the model to group significant stories. It does not perform independent fact checking. Generated JSON is validated only for source indices and required fields. Invalid responses fail the run. Generation refuses to update an open review PR; preserve edits and close the PR before regenerating. Automatic JSON repair, detailed usage metrics, and broader fixture tests remain follow-up work.

AI coverage uses a combined arXiv feed plus seven lab, tooling, and commentary feeds. Weekly selection balances sources (up to 80 AI candidates) before choosing eight stories. This is a bounded sample, not an exhaustive literature review. Preprints and lab claims must be identified as such. Daily collection remains at 08:17 Los Angeles time; feeds are not real-time alerts.

## Publication feeds

`python scripts/publish_feeds.py` builds Atom and RSS feeds in `.cache/feed-site/`, using committed Markdown only. Run from the repository root with dependencies installed. Use `--output` and `--base-url` to override the destination and public URL. Git history must be available (the Pages workflow checks out full history) to preserve publication and update timestamps. Stable entry IDs survive corrections and history rewrites. Feeds retain the latest 52 editions per stream.

The Publish feeds workflow validates PRs and deploys only main to GitHub Pages. Enable Pages with GitHub Actions as the source. Only the generated feed directory is uploaded; raw data, credentials, configuration, and logs are not published. Readers receive summaries and source links, with absolute links to the GitHub Markdown archive. Atom uses `feed.xml` and `feeds/<topic>.xml`; RSS uses `feed.rss.xml` and `feeds/<topic>.rss.xml`.

The public feed base URL is `https://www.cyborgoat.com/weekly-frontier/`, inherited from the account’s Pages domain. GitHub’s default Pages URL redirects there. The domain supports HTTPS; deployment publishes the project path. Update subscription links and the builder base URL together if hosting changes.
