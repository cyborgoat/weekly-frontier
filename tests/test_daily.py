import datetime as dt
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import Mock, patch

from scripts import frontier, news_workflow as workflow
from scripts import publish_feeds as feeds
import feedparser


SOURCE = dict(id='test', name='Test publisher', topic='science', url='https://example.org/rss')
ROW = dict(source='test', topic='science', url='https://example.org/news', title='A discovery',
           published='2026-11-01T00:30:00+00:00', collected='2026-11-01T10:30:00-08:00', text='Evidence. ' * 20)
STORY = dict(source_indices=[0], title='A discovery', summary='Researchers report a discovery.',
             significance='It provides new evidence.', tags=['research'])


def pr(date, state='open', merged=False, number=1):
    return dict(number=number, state=state, merged_at='2026-11-16' if merged else None,
                head={'ref': f'news/daily-{date}'}, base={'sha': 'base'})


class DailyArticles(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for target, value in [('ROOT', self.root), ('SOURCES', [SOURCE])]:
            patcher = patch.object(frontier, target, value); patcher.start(); self.addCleanup(patcher.stop)

    def generate(self, date=dt.date(2026, 11, 1), pending_articles=()):
        with patch.object(frontier, 'collect', return_value=([ROW], {'test': {'ok': True}})), \
             patch.object(frontier, 'model_json', return_value={'stories': [STORY]}) as model:
            frontier.daily(date, pending_articles=pending_articles)
        return model

    def test_publication_month_and_metadata_and_indexes(self):
        self.generate()
        items = frontier.articles(); self.assertEqual(len(items), 1)
        article = items[0]
        # UTC November 1 is still October 31 in Los Angeles.
        self.assertTrue(article['path'].startswith('articles/science/2026/10/'))
        self.assertEqual(article['collected'], '2026-11-01')
        self.assertEqual(article['sources'][0]['url'], ROW['url'])
        self.assertIn('Based on feed excerpts.', article['body'])
        index = self.root/'articles/daily/2026-11-01.md'
        self.assertIn('../science/2026/10/', index.read_text())
        manifest = json.loads((self.root/'data/daily/2026-11-01.json').read_text())
        self.assertEqual(manifest['reporting_weeks'], ['2026-10-26'])

    def test_rerun_preserves_review_edits(self):
        self.generate(); article = self.root/frontier.articles()[0]['path']
        article.write_text(article.read_text() + '\nReviewer correction.\n')
        with patch.object(frontier, 'collect') as collect, patch.object(frontier, 'model_json') as model:
            frontier.daily(dt.date(2026, 11, 1))
            collect.assert_not_called(); model.assert_not_called()
        self.assertIn('Reviewer correction.', article.read_text())

    def test_pending_and_merged_urls_are_not_regenerated(self):
        self.generate(); item = frontier.articles()[0]
        for pending in [(), (item,)]:
            with patch.object(frontier, 'collect', return_value=([ROW], {'test': {'ok': True}})), \
                 patch.object(frontier, 'model_json') as model:
                frontier.daily(dt.date(2026, 11, 2 if not pending else 3), pending_articles=pending)
                model.assert_not_called()
        self.assertEqual(len(frontier.articles()), 1)

    def test_different_url_coverage_is_provided_for_event_deduplication(self):
        self.generate(); item = frontier.articles()[0]
        with patch.object(frontier, 'collect', return_value=([dict(ROW, url='https://other.org/same-event')], {'test': {'ok': True}})), \
             patch.object(frontier, 'model_json', return_value={'stories': []}) as model:
            frontier.daily(dt.date(2026, 11, 2), pending_articles=[item])
        self.assertEqual(model.call_args.args[1]['existing_articles'][0]['id'], item['id'])
        self.assertEqual(len(frontier.articles()), 1)

    def test_pending_url_collection_dedup(self):
        xml = b'<rss version="2.0"><channel><title>Test</title><item><title>A</title><link>https://example.org/news</link><pubDate>Sun, 01 Nov 2026 00:30:00 GMT</pubDate></item></channel></rss>'
        with patch.object(frontier, 'request', return_value=Mock(content=xml)):
            rows, _ = frontier.collect(dry=True, known_urls=[ROW['url']])
        self.assertEqual(rows, [])

    def test_invalid_generation_does_not_write_articles_or_manifest(self):
        for bad in [dict(STORY, source_indices=[99]), dict(STORY, summary=''), dict(STORY, source_indices=[0, 0])]:
            with patch.object(frontier, 'collect', return_value=([ROW], {'test': {'ok': True}})), \
                 patch.object(frontier, 'model_json', return_value={'stories': [bad]}):
                with self.assertRaises(ValueError): frontier.daily(dt.date(2026, 11, 1))
            self.assertFalse((self.root/'articles').exists())
            self.assertFalse((self.root/'data/daily').exists())

    def test_daily_limit_and_all_source_failure(self):
        with patch.object(frontier, 'collect', return_value=([ROW], {'test': {'ok': True}})), \
             patch.object(frontier, 'model_json', return_value={'stories': [STORY] * 9}):
            with self.assertRaisesRegex(ValueError, 'story count'): frontier.daily(dt.date(2026, 11, 1))
        with patch.object(frontier, 'collect', return_value=([], {'test': {'ok': False}})):
            with self.assertRaisesRegex(ValueError, 'No successful collection'): frontier.daily(dt.date(2026, 11, 1))

    def test_dry_run_writes_nothing(self):
        with patch.object(frontier, 'collect', return_value=([ROW], {'test': {'ok': True}})), \
             patch.object(frontier, 'model_json', return_value={'stories': [STORY]}), patch('builtins.print'):
            frontier.daily(dt.date(2026, 11, 1), dry=True)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_weekly_synthesis_uses_articles_and_local_publication_week(self):
        self.generate()
        weekly = dict(overview='This week brought new evidence.', stories=[dict(article_index=0,
            summary='A discovery was reported.', significance='It advances research.')])
        with patch.object(frontier, 'model_json', return_value=weekly) as model:
            frontier.generate(dt.date(2026, 10, 26))
        self.assertEqual(model.call_args.args[1][0]['id'], frontier.articles()[0]['id'])
        text = (self.root/'topics/science/2026/week-of-2026-10-26.md').read_text()
        self.assertIn('This week brought new evidence.', text)
        self.assertIn('../../../articles/science/2026/10/', text)
        self.assertIn('https://example.org/news', text)
        with patch.object(frontier, 'model_json') as model:
            frontier.generate(dt.date(2026, 11, 2)); model.assert_not_called()

    def test_article_feed_content_and_stable_id(self):
        self.generate()
        dates = (dt.datetime(2026, 11, 1, tzinfo=dt.timezone.utc), dt.datetime(2026, 11, 2, tzinfo=dt.timezone.utc))
        with patch.object(feeds, 'timestamps', return_value=dates):
            feeds.build(self.root, self.root/'output')
            atom = feedparser.parse((self.root/'output/articles/feed.xml').read_bytes())
            rss = feedparser.parse((self.root/'output/articles/feed.rss.xml').read_bytes())
            self.assertFalse(atom.bozo); self.assertFalse(rss.bozo)
            self.assertEqual(len(atom.entries), 1)
            entry = atom.entries[0]
            self.assertEqual(entry.id, rss.entries[0].id)
            self.assertIn('Researchers report', entry.content[0].value)
            self.assertNotIn('source_indices', entry.content[0].value)
            self.assertNotIn('collected:', entry.content[0].value)
            self.assertEqual(len(feedparser.parse((self.root/'output/feeds/articles/science.xml').read_bytes()).entries), 1)
            self.assertEqual(len(feedparser.parse((self.root/'output/feed.xml').read_bytes()).entries), 0)
            path = self.root/frontier.articles()[0]['path']; path.write_text(path.read_text()+'\nCorrection.\n')
            self.assertEqual(feeds.article_entries(self.root)[0]['id'], entry.id)


class Automation(unittest.TestCase):
    def test_schedule_both_dst_offsets_and_transition_days(self):
        for day in ['2026-03-07', '2026-03-08', '2026-07-01', '2026-11-01', '2026-12-01']:
            commands = [workflow.scheduled_command(dt.datetime.fromisoformat(f'{day}T{hour}:30:00+00:00'))
                        for hour in ['17', '18', '19']]
            self.assertEqual(commands.count('daily'), 1)
            self.assertEqual(commands.count('generate'), 1)
        self.assertEqual(workflow.scheduled_command(dt.datetime.now(frontier.TZ), 'workflow_dispatch', 'generate'), 'generate')

    def test_open_reviews_block_including_monday_and_late_coverage(self):
        start = dt.date(2026, 11, 9)
        self.assertTrue(workflow.blocks_week(pr('2026-11-16'), start))
        self.assertTrue(workflow.blocks_week(pr('2026-11-18'), start, ['2026-11-09']))
        self.assertFalse(workflow.blocks_week(pr('2026-11-18'), start))
        self.assertFalse(workflow.blocks_week(pr('2026-11-13', 'closed'), start))

    def test_daily_rerun_preserves_any_resolved_or_open_pr(self):
        for state in ['open', 'closed']:
            with patch.object(frontier, 'daily') as daily, patch.object(workflow, 'create_pr') as create:
                workflow.prepare_daily(dt.date(2026, 11, 13), [pr('2026-11-13', state)])
                daily.assert_not_called(); create.assert_not_called()

    def test_overdue_weeks_are_oldest_first(self):
        with patch.object(workflow, 'approved_manifests', return_value=[]):
            self.assertEqual(workflow.due_weeks(dt.date(2026, 11, 25), [pr('2026-11-11')]),
                             [dt.date(2026, 11, 9), dt.date(2026, 11, 16)])

    def test_late_collected_articles_add_their_original_reporting_week(self):
        manifests = [dict(date='2026-11-18', reporting_weeks=['2026-11-02'])]
        with patch.object(workflow, 'approved_manifests', return_value=manifests):
            self.assertEqual(workflow.due_weeks(dt.date(2026, 11, 23), []),
                             [dt.date(2026, 11, 2), dt.date(2026, 11, 16)])

    def test_weekly_wait_then_retry_after_rejection(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(frontier, 'ROOT', Path(directory)), \
             patch.object(workflow, 'approved_manifests', return_value=[]), \
             patch.object(workflow, 'snapshot', return_value={'weeks': []}), \
             patch.object(frontier, 'generate') as generate, patch.object(workflow, 'create_pr') as create:
            workflow.prepare_weekly(dt.date(2026, 11, 16), [pr('2026-11-16')], '2026-11-09')
            generate.assert_not_called(); create.assert_not_called()
            workflow.prepare_weekly(dt.date(2026, 11, 17), [pr('2026-11-16', 'closed')], '2026-11-09')
            generate.assert_called_once()
            self.assertIn('not approved', generate.call_args.kwargs['coverage_notes'][0])
            create.assert_called_once()

    def test_weekly_waits_for_monday_collection_and_preserves_weekly_review(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(frontier, 'ROOT', Path(directory)), \
             patch.object(workflow, 'approved_manifests', return_value=[]), \
             patch.object(frontier, 'generate') as generate:
            workflow.prepare_weekly(dt.date(2026, 11, 16), [], '2026-11-09')
            generate.assert_not_called()
            weekly = pr('2026-11-16'); weekly['head']['ref'] = 'news/week-of-2026-11-09'
            workflow.prepare_weekly(dt.date(2026, 11, 16), [weekly], '2026-11-09')
            generate.assert_not_called()
