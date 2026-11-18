import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

from scripts import frontier, news_workflow as workflow

SOURCE = dict(id='test', name='Test publisher', topic='science', url='https://example.org/rss')
ROW = dict(source='test', topic='science', url='https://example.org/one', title='First discovery',
           published='2026-11-10T12:00:00+00:00', collected='2026-11-10T10:30:00-08:00', text='Evidence. ' * 20)
STORY = dict(source_index=0, summary='Researchers report a discovery.',
             significance='It provides new evidence.', tags=['research'])
START = dt.date(2026, 11, 9)


def pr(date='2026-11-10', state='open', merged=False, number=1):
    return dict(number=number, state=state, merged_at='2026-11-10' if merged else None,
                head={'ref': f'news/week-of-2026-11-09-update-{date}'}, base={'sha': 'base', 'ref': 'main'})


class IncrementalBriefings(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for target, value in [('ROOT', self.root), ('SOURCES', [SOURCE])]:
            patcher = patch.object(frontier, target, value); patcher.start(); self.addCleanup(patcher.stop)
        self.page = self.root/'topics/science/2026/week-of-2026-11-09.md'

    def update(self, rows, date=dt.date(2026, 11, 10), stories=None):
        with patch.object(frontier, 'collect', return_value=(rows, {'test': {'ok': True}})), \
             patch.object(frontier, 'model_json', return_value={'stories': [STORY] if stories is None else stories}) as model:
            frontier.daily(date)
        return model

    def test_collection_archive_uses_batch_date_not_last_source_timestamp(self):
        xml = b'<rss version="2.0"><channel><title>Test</title><item><title>A</title><link>https://example.org/a</link><pubDate>Sun, 01 Nov 2026 00:30:00 GMT</pubDate></item></channel></rss>'
        with patch.object(frontier, 'request', return_value=Mock(content=xml)):
            frontier.collect(date=dt.date(2026, 11, 17))
        self.assertTrue((self.root/'data/articles/2026-11-17.jsonl').exists())
        self.assertTrue((self.root/'data/collections/2026-11-17.json').exists())
        self.assertEqual(len(frontier.records()), 1)

    def test_second_day_appends_and_preserves_reviewed_prose(self):
        self.update([ROW])
        self.page.write_text(self.page.read_text().replace(STORY['summary'], 'A reviewer corrected this summary.'))
        second = dict(ROW, url='https://example.org/two', title='Second discovery', published='2026-11-11T12:00:00+00:00')
        model = self.update([ROW, second], dt.date(2026, 11, 11))
        text = self.page.read_text()
        self.assertIn('A reviewer corrected this summary.', text)
        self.assertLess(text.index('## First discovery'), text.index('## Second discovery'))
        self.assertEqual(text.count('## First discovery'), 1)
        self.assertEqual(model.call_args.args[1]['candidates'][0]['url'], second['url'])
        self.assertIn('A reviewer corrected this summary.', model.call_args.args[1]['existing_briefing'])
        self.assertIn('Coverage through 2026-11-11', text)
        self.assertFalse((self.root/'articles').exists())

    def test_rerun_does_not_duplicate_stories_or_call_model(self):
        self.update([ROW]); before = self.page.read_text()
        model = self.update([ROW]); model.assert_not_called()
        self.assertEqual(self.page.read_text(), before)

    def test_different_urls_for_same_event_use_existing_context(self):
        self.update([ROW]); duplicate = dict(ROW, url='https://another.org/same-event')
        model = self.update([duplicate], dt.date(2026, 11, 11), stories=[])
        self.assertIn('## First discovery', model.call_args.args[1]['existing_briefing'])
        self.assertEqual(self.page.read_text().count('## First discovery'), 1)

    def test_unselected_candidates_are_not_retried_every_day(self):
        self.update([ROW], stories=[])
        model = self.update([ROW], dt.date(2026, 11, 11)); model.assert_not_called()

    def test_week_rollover_starts_new_page_without_changing_previous_prose(self):
        self.update([ROW]); previous = self.page.read_text()
        next_week = dict(ROW, url='https://example.org/next', published='2026-11-16T12:00:00+00:00')
        self.update([next_week], dt.date(2026, 11, 16))
        self.assertEqual(self.page.read_text(), previous)
        self.assertTrue((self.root/'topics/science/2026/week-of-2026-11-16.md').exists())

    def test_monday_finalization_can_append_late_sunday_story(self):
        self.update([ROW]); late = dict(ROW, url='https://example.org/sunday', title='Sunday discovery',
                                       published='2026-11-16T05:00:00+00:00')
        with patch.object(frontier, 'model_json', return_value={'stories': [STORY]}):
            frontier.generate(START, through=dt.date(2026, 11, 16), extra_rows=[late])
        self.assertIn('## Sunday discovery', self.page.read_text())
        self.assertIn('Reporting period ended.', self.page.read_text())
        state = json.loads((self.root/'data/editions/week-of-2026-11-09.json').read_text())
        self.assertTrue(state['finalized'])

    def test_publication_date_uses_la_week_at_utc_boundary(self):
        sunday = dict(ROW, published='2026-11-09T01:00:00+00:00')
        model = self.update([sunday]); model.assert_not_called()
        self.assertIn('No eligible stories collected.', self.page.read_text())

    def test_more_than_eight_total_stories_allowed_across_days(self):
        for offset in range(2):
            day = dt.date(2026, 11, 10+offset)
            rows = [dict(ROW, url=f'https://example.org/{offset}-{i}', title=f'Discovery {offset}-{i}') for i in range(8)]
            self.update(rows, day, [dict(STORY, source_index=i) for i in range(8)])
        self.assertEqual(self.page.read_text().count('\n## Discovery'), 16)

    def test_invalid_response_does_not_overwrite_existing_pages(self):
        self.update([ROW]); before = self.page.read_text()
        second = dict(ROW, url='https://example.org/two')
        with patch.object(frontier, 'model_json', return_value={'stories': [dict(STORY, source_index=99)]}):
            with self.assertRaisesRegex(ValueError, 'source reference'):
                frontier.generate(START, through=dt.date(2026, 11, 11), extra_rows=[second])
        self.assertEqual(self.page.read_text(), before)

    def test_all_source_failure_and_story_limit(self):
        with patch.object(frontier, 'collect', return_value=([], {'test': {'ok': False}})):
            with self.assertRaisesRegex(ValueError, 'No successful collection'): frontier.daily(dt.date(2026, 11, 10))
        with self.assertRaisesRegex(ValueError, 'story count'): self.update([ROW], stories=[STORY]*9)

    def test_dry_run_does_not_write_files(self):
        with patch.object(frontier, 'collect', return_value=([ROW], {'test': {'ok': True}})), \
             patch.object(frontier, 'model_json', return_value={'stories': [STORY]}), patch('builtins.print'):
            frontier.daily(dt.date(2026, 11, 10), dry=True)
        self.assertEqual(list(self.root.iterdir()), [])


class ReviewLifecycle(unittest.TestCase):
    def test_schedule_both_dst_offsets_and_transition_days(self):
        for day in ['2026-03-07', '2026-03-08', '2026-07-01', '2026-11-01', '2026-12-01']:
            commands = [workflow.scheduled_command(dt.datetime.fromisoformat(f'{day}T{hour}:30:00+00:00'))
                        for hour in ['17', '18', '19']]
            self.assertEqual(commands.count('daily'), 1)
            self.assertEqual(commands.count('generate'), 1)

    def test_open_review_is_resumed_and_reviewer_commits_preserved(self):
        review = pr()
        with patch.object(workflow, 'run', side_effect=['base-head', '', 'review-head', '', '']) as run:
            branch, found = workflow.checkout_review(START, dt.date(2026, 11, 11), [review])
        self.assertEqual(found, review)
        self.assertEqual(branch, review['head']['ref'])
        self.assertIn(('git', 'switch', '-c', branch, 'review-head'), [call.args for call in run.call_args_list])
        self.assertEqual(run.call_args.args, ('git', 'merge', '--no-edit', 'base-head'))

    def test_merged_review_leads_to_fresh_next_day_pr_branch(self):
        with patch.object(workflow, 'run') as run:
            branch, review = workflow.checkout_review(START, dt.date(2026, 11, 11), [pr(state='closed', merged=True)])
        self.assertIsNone(review)
        self.assertEqual(branch, 'news/week-of-2026-11-09-update-2026-11-11')
        run.assert_called_once_with('git', 'switch', '-c', branch)

    def test_same_day_merged_rerun_and_rejected_review_are_preserved(self):
        for review in [pr(state='closed', merged=True), pr(state='closed')]:
            with patch.object(workflow, 'run') as run:
                self.assertEqual(workflow.checkout_review(START, dt.date(2026, 11, 10), [review]), (None, None))
                run.assert_not_called()

    def test_merge_conflict_stops_before_generation(self):
        import subprocess
        with patch.object(workflow, 'run', side_effect=['base', '', 'head', '', subprocess.CalledProcessError(1, 'git merge')]):
            with self.assertRaises(subprocess.CalledProcessError):
                workflow.checkout_review(START, dt.date(2026, 11, 11), [pr()])

    def test_pending_archive_context_is_kept_when_daily_collect_runs(self):
        with patch.object(workflow, 'pending_records', return_value=[ROW]), \
             patch.object(workflow, 'checkout_review', return_value=('branch', pr())), \
             patch.object(frontier, 'collect', return_value=([], {'test': {'ok': True}})) as collect, \
             patch.object(frontier, 'archive_collection') as archive, \
             patch.object(frontier, 'generate') as generate, patch.object(workflow, 'publish_review'):
            workflow.prepare('daily', dt.date(2026, 11, 11), [pr()])
        self.assertEqual(collect.call_args.kwargs['known_urls'], [ROW['url']])
        self.assertEqual(generate.call_args.kwargs['extra_rows'], [ROW])
        archive.assert_called_once()
