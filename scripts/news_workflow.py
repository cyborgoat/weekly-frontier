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


# Fixed UTC crons; identity survives GitHub delay (see intended_cron_time).
CRON_COMMANDS = {'0 6 * * *': 'daily', '0 7 * * *': 'generate'}


def intended_cron_time(now, schedule):
    """Most recent UTC fire for this cron at or before now (delay-tolerant)."""
    if schedule not in CRON_COMMANDS:
        return None
    hour = int(schedule.split()[1])
    utc = now.astimezone(dt.timezone.utc)
    intended = utc.replace(hour=hour, minute=0, second=0, microsecond=0)
    if utc < intended:
        intended -= dt.timedelta(days=1)
    return intended


def scheduled_command(now, event='schedule', command='daily', schedule=''):
    if event == 'workflow_dispatch': return command
    if schedule in CRON_COMMANDS:
        return CRON_COMMANDS[schedule]
    return {6: 'daily', 7: 'generate'}.get(now.astimezone(dt.timezone.utc).hour, '')


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
        number = str(pr['number'])
        print(f'Updated weekly review PR #{number}.')
    else:
        print(run('gh', 'pr', 'create', '--base', os.environ.get('DEFAULT_BRANCH', 'main'),
                  '--head', branch, '--title', title, '--body',
                  'Incremental updates to the weekly topic briefings, with daily feed archives. '
                  'Each topic briefing appends up to 5 new stories per day and keeps prior picks. '
                  'The news workflow merges this PR automatically and opens a fresh PR on the next update.'))
        number = run('gh', 'pr', 'view', branch, '--json', 'number', '--jq', '.number')
    # GITHUB_TOKEN merges do not trigger other workflows; dispatch Publish site explicitly.
    run('gh', 'pr', 'merge', number, '--merge', '--delete-branch')
    print(f'Merged PR #{number}.')
    run('gh', 'workflow', 'run', 'publish-site.yaml')
    print('Triggered Publish site workflow.')


def prepare(command, date, prs, requested=None):
    # daily and generate both target the current reporting week unless week_of is set.
    start = frontier.monday(requested) if requested else frontier.week_start(date)
    pending = [row for pr in prs if pr['state'] == 'open' for row in pending_records(pr)]
    # Collect before checking out the pending review so code/settings come from the selected base branch.
    rows = []; outcomes = {}
    if command == 'daily':
        rows, outcomes = frontier.collect(dry=True, date=date, known_urls=[r['url'] for r in pending])
        if not any(value.get('ok') for value in outcomes.values()):
            raise ValueError('No successful collection; retry the daily run')
    else:
        state_path = frontier.ROOT/f'data/editions/week-of-{start}.json'
        if state_path.exists() and frontier.edition_finalized(json.loads(state_path.read_text())):
            print(f'week-of-{start} is already finalized; skipping.')
            return
    branch, review = checkout_review(start, date, prs)
    if branch is None: return
    if command == 'daily': frontier.archive_collection(date, rows, outcomes)
    extra = [*pending, *rows]
    # Lock the prior week in the same run once we have moved past it (late Sunday catch-up).
    previous = start - dt.timedelta(days=7)
    prev_path = frontier.ROOT/f'data/editions/week-of-{previous}.json'
    if prev_path.exists() and not frontier.edition_finalized(json.loads(prev_path.read_text())):
        frontier.generate(previous, through=date, extra_rows=extra)
    frontier.generate(start, through=date, extra_rows=extra)
    publish_review(start, branch, review)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['mode', 'daily', 'collect', 'generate'])
    parser.add_argument('--date', type=dt.date.fromisoformat); parser.add_argument('--week-of')
    args = parser.parse_args()
    now_utc = dt.datetime.now(dt.timezone.utc)
    # Mode DST checks still need a zoned timestamp; schedules are UTC.
    now = now_utc.astimezone(frontier.TZ)
    if args.command == 'mode':
        event = os.environ.get('EVENT', 'schedule')
        schedule = os.environ.get('SCHEDULE', '')
        command = scheduled_command(
            now_utc, event, os.environ.get('COMMAND') or 'daily', schedule)
        if command == 'collect': command = 'daily'
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            output.write(f'command={command}\n')
            # Bind work to the cron's intended UTC date, not the delayed wall clock.
            if event == 'schedule' and command:
                intended = intended_cron_time(now_utc, schedule)
                if intended is not None:
                    output.write(f'date={intended.date().isoformat()}\n')
        return
    prs = pull_requests()
    run('git', 'config', 'user.name', 'weekly-frontier[bot]')
    run('git', 'config', 'user.email', 'weekly-frontier@users.noreply.github.com')
    # Coverage through / branch update date default to the UTC run day (matches cron).
    prepare('daily' if args.command == 'collect' else args.command,
            args.date or now_utc.date(), prs, args.week_of)


if __name__ == '__main__': main()
