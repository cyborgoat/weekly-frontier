"""GitHub Actions orchestration. Local frontier commands never create PRs."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import subprocess

try:
    from . import frontier
except ImportError:
    import frontier


def run(*args):
    try:
        return subprocess.run(args, cwd=frontier.ROOT, check=True, capture_output=True, text=True).stdout.strip()
    except subprocess.CalledProcessError as exc:
        print(exc.stdout)
        print(exc.stderr)
        raise


def scheduled_command(now, event='schedule', command='daily'):
    if event == 'workflow_dispatch': return command
    return {10: 'daily', 11: 'generate'}.get(now.astimezone(frontier.TZ).hour, '')


def pull_requests():
    repository = os.environ['GITHUB_REPOSITORY']
    pages = json.loads(run('gh', 'api', '--paginate', '--slurp',
                           f'repos/{repository}/pulls?state=all&per_page=100'))
    return [pr for page in pages for pr in page if pr['head']['repo'] and
            pr['head']['repo']['full_name'] == repository and
            pr['head']['ref'].startswith(('news/daily-', 'news/week-of-'))]


def daily_date(pr):
    branch = pr['head']['ref']
    try: return dt.date.fromisoformat(branch.removeprefix('news/daily-')) if branch.startswith('news/daily-') else None
    except ValueError: return None


def snapshot(pr):
    """Read pending content without checking it out or modifying the working tree."""
    run('git', 'fetch', 'origin', f'refs/pull/{pr["number"]}/head')
    head = run('git', 'rev-parse', 'FETCH_HEAD')
    paths = run('git', 'diff', '--name-only', '--diff-filter=AM',
                f'{pr["base"]["sha"]}...{head}', '--', 'articles', 'data').splitlines()
    items = []; urls = set(); weeks = set()
    for path in paths:
        if path.startswith('articles/') and path.endswith('.md') and Path(path).name != 'README.md':
            items.append(frontier.read_article(run('git', 'show', f'{head}:{path}'), path))
        elif path.startswith('data/articles/') and path.endswith('.jsonl'):
            urls.update(json.loads(line)['url'] for line in run('git', 'show', f'{head}:{path}').splitlines() if line)
        elif path == f'data/daily/{daily_date(pr)}.json':
            weeks.update(json.loads(run('git', 'show', f'{head}:{path}'))['reporting_weeks'])
    return dict(articles=items, urls=urls, weeks=weeks)


def blocks_week(pr, start, weeks=()):
    date = daily_date(pr)
    return pr['state'] == 'open' and date is not None and (
        start <= date <= start + dt.timedelta(days=7) or str(start) in weeks)


def create_pr(branch, title, body):
    paths = [p for p in ['data', 'articles', 'weekly', 'topics', 'README.md'] if (frontier.ROOT/p).exists()]
    run('git', 'add', '--', *paths)
    if not run('git', 'diff', '--cached', '--name-only'):
        print('No changes to submit.'); return
    run('git', 'switch', '-c', branch)
    run('git', 'commit', '-m', title)
    # Token-created PRs do not trigger other workflows, so validate here too.
    run('python', '-m', 'unittest', 'discover', '-s', 'tests')
    run('python', 'scripts/publish_feeds.py')
    run('git', 'push', '--set-upstream', 'origin', branch)
    print(run('gh', 'pr', 'create', '--base', os.environ.get('DEFAULT_BRANCH', 'main'),
              '--head', branch, '--title', title, '--body', body))


def prepare_daily(date, prs):
    if any(daily_date(pr) == date for pr in prs):
        print(f'Daily PR for {date} already exists or was resolved; preserving reviewer content.')
        return
    pending = [snapshot(pr) for pr in prs if daily_date(pr) and pr['state'] == 'open']
    frontier.daily(date, pending_articles=[a for p in pending for a in p['articles']],
                   pending_urls={url for p in pending for url in p['urls']})
    create_pr(f'news/daily-{date}', f'News: daily articles for {date}',
              'Daily feed archives and selected standalone articles. Review summaries, source links, '
              'duplicate coverage, and factual accuracy before merging. Based on feed excerpts.')


def approved_manifests():
    return [json.loads(p.read_text()) for p in (frontier.ROOT/'data/daily').glob('*.json')]


def due_weeks(today, prs, requested=None, pending_weeks=()):
    if requested: return [frontier.monday(requested)]
    manifests = approved_manifests()
    dates = [dt.date.fromisoformat(m['date']) for m in manifests]
    dates.extend(daily_date(pr) for pr in prs if daily_date(pr))
    if not dates: return []
    first = min(dates); start = first-dt.timedelta(days=first.weekday())
    result = {frontier.monday(week) for week in pending_weeks}
    result.update(frontier.monday(week) for m in manifests for week in m['reporting_weeks'])
    while start + dt.timedelta(days=7) <= today:
        result.add(start); start += dt.timedelta(days=7)
    return sorted(start for start in result if start + dt.timedelta(days=7) <= today)


def prepare_weekly(today, prs, requested=None):
    pending = {pr['number']: snapshot(pr) for pr in prs if daily_date(pr) and pr['state'] == 'open'}
    manifests = approved_manifests()
    dates = [dt.date.fromisoformat(m['date']) for m in manifests]
    dates.extend(daily_date(pr) for pr in prs if daily_date(pr))
    rollout = min(dates, default=today)
    for start in due_weeks(today, prs, requested, [w for p in pending.values() for w in p['weeks']]):
        if start + dt.timedelta(days=7) > today:
            raise ValueError('Reporting week has not ended')
        key = f'week-of-{start}'; branch = f'news/{key}'
        if (frontier.ROOT/f'weekly/{start.year}/{key}.md').exists(): continue
        weekly_prs = [pr for pr in prs if pr['head']['ref'] == branch]
        if weekly_prs:
            if any(pr['state'] == 'open' for pr in weekly_prs):
                print(f'Weekly PR {key} is awaiting review; preserving it.'); return
            continue
        waiting = [pr for pr in prs if blocks_week(pr, start, pending.get(pr['number'], {}).get('weeks', ()))]
        if waiting:
            print(f'Waiting for daily reviews before {key}: ' + ', '.join(str(pr['number']) for pr in waiting))
            return
        end = start + dt.timedelta(days=7)
        # Monday polling captures Sunday stories published after Sunday's poll.
        if end >= rollout and not any(m['date'] == str(end) for m in manifests) and not any(daily_date(pr) == end for pr in prs):
            print(f'Waiting for the {end} collection before {key}.'); return
        rejected = [pr for pr in prs if daily_date(pr) is not None and start <= daily_date(pr) <= end
                    and pr['state'] == 'closed' and not pr.get('merged_at')]
        notes = [f'Daily content collected on {daily_date(pr)} was not approved for publication.' for pr in rejected]
        approved_dates = {m['date'] for m in manifests}
        if any(str(start + dt.timedelta(days=i)) not in approved_dates for i in range(8)):
            notes.append('Coverage is incomplete because some daily collections were unavailable or not approved.')
        frontier.generate(start, coverage_notes=notes)
        create_pr(branch, f'News: {key}',
                  'Weekly synthesis of approved standalone articles, with links to article pages and original sources. '
                  'Daily reviews are resolved. Review summaries and coverage notes before merging.')
        return


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['mode', 'daily', 'collect', 'generate'])
    parser.add_argument('--date', type=dt.date.fromisoformat)
    parser.add_argument('--week-of'); args = parser.parse_args()
    now = dt.datetime.now(frontier.TZ)
    if args.command == 'mode':
        command = scheduled_command(now, os.environ.get('EVENT', 'schedule'), os.environ.get('COMMAND') or 'daily')
        if command == 'collect': command = 'daily'
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output: output.write(f'command={command}\n')
        return
    prs = pull_requests()
    run('git', 'config', 'user.name', 'weekly-frontier[bot]')
    run('git', 'config', 'user.email', 'weekly-frontier@users.noreply.github.com')
    if args.command in ('daily', 'collect'): prepare_daily(args.date or now.date(), prs)
    else: prepare_weekly(now.date(), prs, args.week_of)


if __name__ == '__main__': main()
