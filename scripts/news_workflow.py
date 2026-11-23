"""Review-aware daily updates to the existing weekly Markdown briefings."""
import argparse
import datetime as dt
import json
import os
import re
import subprocess

try:
    from . import frontier
except ImportError:
    import frontier


def run(*args):
    try:
        return subprocess.run(args, cwd=frontier.ROOT, check=True, capture_output=True, text=True).stdout.strip()
    except subprocess.CalledProcessError as exc:
        print(exc.stdout); print(exc.stderr)
        raise


def scheduled_command(now, event='schedule', command='daily', schedule=''):
    if event == 'workflow_dispatch': return command
    # Target 10:30 daily and 11:30 previous-week finalization in Los Angeles time.
    # Prefer the triggering cron identity so multi-hour GitHub delays still run the
    # intended job instead of becoming successful no-ops.
    local = now.astimezone(frontier.TZ)
    hour = local.hour
    if not (9 <= hour <= 18):
        return ''
    pdt = local.dst() != dt.timedelta(0)
    if schedule == '30 17 * * *':
        return 'daily' if pdt else ''
    if schedule == '30 19 * * *':
        return 'generate' if not pdt else ''
    if schedule == '30 18 * * *':
        return 'generate' if pdt else 'daily'
    return {10: 'daily', 11: 'generate'}.get(hour, '')


def review_week(pr):
    match = re.fullmatch(r'news/week-of-(\d{4}-\d{2}-\d{2})(?:-update-\d{4}-\d{2}-\d{2})?', pr['head']['ref'])
    if not match: return None
    try: return frontier.monday(match[1])
    except ValueError: return None


def pull_requests():
    repository = os.environ['GITHUB_REPOSITORY']
    base = os.environ.get('DEFAULT_BRANCH', 'main')
    pages = json.loads(run('gh', 'api', '--paginate', '--slurp',
                           f'repos/{repository}/pulls?state=all&per_page=100'))
    return [pr for page in pages for pr in page if pr['head']['repo'] and
            pr['head']['repo']['full_name'] == repository and pr['base']['ref'] == base
            and review_week(pr) is not None]


def pending_records(pr):
    run('git', 'fetch', 'origin', f'refs/pull/{pr["number"]}/head')
    head = run('git', 'rev-parse', 'FETCH_HEAD')
    paths = run('git', 'diff', '--name-only', '--diff-filter=AM',
                f'{pr["base"]["sha"]}...{head}', '--', 'data/articles').splitlines()
    return [json.loads(line) for path in paths if path.endswith('.jsonl')
            for line in run('git', 'show', f'{head}:{path}').splitlines() if line]


def checkout_review(start, date, prs):
    reviews = sorted([pr for pr in prs if review_week(pr) == start], key=lambda pr: pr['number'], reverse=True)
    opened = [pr for pr in reviews if pr['state'] == 'open']
    if len(opened) > 1: raise ValueError('Multiple open review PRs for this week; resolve them before updating')
    if opened:
        pr = opened[0]; base = run('git', 'rev-parse', 'HEAD')
        run('git', 'fetch', 'origin', f'refs/pull/{pr["number"]}/head')
        head = run('git', 'rev-parse', 'FETCH_HEAD')
        branch = pr['head']['ref']
        run('git', 'switch', '-c', branch, head)
        # Preserve all reviewer commits. Conflicts fail safely; never force-push.
        run('git', 'merge', '--no-edit', base)
        return branch, pr
    if reviews and not reviews[0].get('merged_at'):
        print('The latest weekly review was rejected; reopen it to resume updates.')
        return None, None
    branch = f'news/week-of-{start}-update-{date}'
    if any(pr['head']['ref'] == branch for pr in reviews):
        print('This update was already merged; the next daily run will open a new PR.')
        return None, None
    run('git', 'switch', '-c', branch)
    return branch, None


def publish_review(start, branch, pr):
    run('git', 'add', '--', 'data', 'weekly', 'topics', 'README.md')
    if not run('git', 'diff', '--cached', '--name-only'):
        print('No new weekly content to submit.'); return
    title = f'News: incremental briefing for week of {start}'
    run('git', 'commit', '-m', title)
    # Token-created PRs do not trigger other workflows, so validate here too.
    run('python', '-m', 'unittest', 'discover', '-s', 'tests')
    run('python', 'scripts/publish_feeds.py')
    run('git', 'push', '--set-upstream', 'origin', branch)
    if pr:
        print(f'Updated weekly review PR #{pr["number"]}.')
    else:
        print(run('gh', 'pr', 'create', '--base', os.environ.get('DEFAULT_BRANCH', 'main'),
                  '--head', branch, '--title', title, '--body',
                  'Incremental updates to the weekly topic briefings, with daily feed archives. '
                  'Each topic briefing selects up to 20 weekly stories and preserves prose for retained picks. '
                  'Daily runs update this PR while it is open; after merging, the next update opens a new PR. '
                  'Review source links, duplicate coverage, and factual accuracy before merging.'))


def prepare(command, date, prs, requested=None):
    start = frontier.monday(requested) if requested else (
        frontier.week_start(date) if command == 'daily' else frontier.week_start(date)-dt.timedelta(days=7))
    pending = [row for pr in prs if pr['state'] == 'open' for row in pending_records(pr)]
    # Collect before checking out the pending review so code/settings come from the selected base branch.
    rows = []; outcomes = {}
    if command == 'daily':
        rows, outcomes = frontier.collect(dry=True, date=date, known_urls=[r['url'] for r in pending])
        if not any(value.get('ok') for value in outcomes.values()):
            raise ValueError('No successful collection; retry the daily run')
    elif not (frontier.ROOT/f'weekly/{start.year}/week-of-{start}.md').exists() and not any(
            review_week(pr) == start for pr in prs) and not any(
            frontier.in_reporting_week(row['published'], start, start+dt.timedelta(days=7)) for row in pending):
        print('No previous weekly edition to finalize.'); return
    branch, review = checkout_review(start, date, prs)
    if branch is None: return
    if command == 'daily': frontier.archive_collection(date, rows, outcomes)
    frontier.generate(start, through=date, extra_rows=[*pending, *rows])
    publish_review(start, branch, review)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['mode', 'daily', 'collect', 'generate'])
    parser.add_argument('--date', type=dt.date.fromisoformat); parser.add_argument('--week-of')
    args = parser.parse_args(); now = dt.datetime.now(frontier.TZ)
    if args.command == 'mode':
        command = scheduled_command(
            now, os.environ.get('EVENT', 'schedule'), os.environ.get('COMMAND') or 'daily',
            os.environ.get('SCHEDULE', ''))
        if command == 'collect': command = 'daily'
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output: output.write(f'command={command}\n')
        return
    prs = pull_requests()
    run('git', 'config', 'user.name', 'weekly-frontier[bot]')
    run('git', 'config', 'user.email', 'weekly-frontier@users.noreply.github.com')
    prepare('daily' if args.command == 'collect' else args.command, args.date or now.date(), prs, args.week_of)


if __name__ == '__main__': main()
