import unittest
from scripts.frontier import monday, TZ
import datetime as dt
class Dates(unittest.TestCase):
    def test_monday(self):
        self.assertEqual(str(monday('2026-11-09')), '2026-11-09')
        with self.assertRaises(ValueError): monday('2026-11-10')
    def test_dst(self):
        self.assertNotEqual(dt.datetime(2026,7,1,tzinfo=TZ).utcoffset(),dt.datetime(2026,12,1,tzinfo=TZ).utcoffset())

from unittest.mock import patch, Mock
import tempfile
from pathlib import Path
from scripts import frontier
class FeedText(unittest.TestCase):
    def test_prefers_usable_summary_over_embedded_body(self):
        summary = 'A concise research excerpt. ' * 5
        self.assertEqual(frontier.feed_text({'summary': '<p>'+summary+'</p>', 'content': [{'value': 'Full body. '*100}]}), summary.strip())

    def test_short_summary_falls_back_to_feed_content_and_keeps_cap(self):
        text = frontier.feed_text({'summary': 'Brief subtitle', 'content': [{'value': '<p>'+'Research details. '*1000+'</p>'}]})
        self.assertEqual(len(text), 12000)
        self.assertTrue(text.startswith('Research details.'))
        self.assertNotIn('<p>', text)

    def test_title_only_entries_do_not_invent_summary(self):
        self.assertEqual(frontier.feed_text({'title': 'Model launch'}), '')

class Collection(unittest.TestCase):
    def test_content_only_rss_is_archived_without_fetching_article(self):
        excerpt = 'Research details supplied inside the RSS feed. ' * 4
        xml = ('<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">'
               '<channel><title>Test</title><item><title>Story</title><link>https://example.org/a</link>'
               '<pubDate>Mon, 09 Nov 2026 12:00:00 GMT</pubDate>'
               '<description>Short subtitle</description><content:encoded><![CDATA[<p>'+excerpt+
               '</p>]]></content:encoded></item></channel></rss>').encode()
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(frontier, 'ROOT', Path(directory)), \
                 patch.object(frontier, 'SOURCES', [{'id': 'test', 'topic': 'ai', 'url': 'https://example.org/rss'}]), \
                 patch.object(frontier, 'request', return_value=Mock(content=xml)) as request:
                frontier.collect()
                self.assertEqual(frontier.records()[0]['text'], excerpt.strip())
                request.assert_called_once_with('GET', 'https://example.org/rss')

    def test_feed_archive_and_dedup(self):
        xml=b'<rss version="2.0"><channel><title>Test</title><item><title>Story</title><link>https://example.org/a</link><pubDate>Mon, 09 Nov 2026 12:00:00 GMT</pubDate><description>News excerpt</description></item></channel></rss>'
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory); (root/'data/articles').mkdir(parents=True)
            with patch.object(frontier,'ROOT',root), patch.object(frontier,'SOURCES',[{'id':'test','topic':'science','url':'https://example.org/rss'}]), patch.object(frontier,'request',return_value=Mock(content=xml)):
                frontier.collect(); frontier.collect()
                self.assertEqual(len(frontier.records()),1)
    def test_all_sources_fail_prevents_generation(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(frontier,'ROOT',Path(directory)):
                with self.assertRaisesRegex(ValueError,'No successful collection'):
                    frontier.generate(monday('2026-11-09'))

class Completions(unittest.TestCase):
    def test_model_has_separate_read_timeout(self):
        import os
        with patch.dict(os.environ, LLM_BASE_URL='https://example.org/v1', LLM_API_KEY='test', LLM_MODEL='test'), \
             patch.object(frontier, 'request', return_value=Mock(json=lambda: {'choices': [{'message': {'content': '{"stories":[]}'}}]})) as request:
            self.assertEqual(frontier.model_json('Select stories.', []), {'stories': []})
        self.assertEqual(request.call_args.kwargs['timeout'], (10, 300))

    def test_request_forwards_timeout_override(self):
        with patch.object(frontier.requests, 'request', return_value=Mock()) as request:
            frontier.request('GET', 'https://example.org')
            self.assertEqual(request.call_args.kwargs['timeout'], 60)
            frontier.request('POST', 'https://example.org', timeout=(10, 300))
            self.assertEqual(request.call_args.kwargs['timeout'], (10, 300))

    def test_string_and_blocks(self):
        for content in ['{"stories":[]}', [{'type':'text','text':'{"stories":[]}'}]]:
            self.assertEqual(frontier.completion_text({'choices':[{'message':{'content':content},'finish_reason':'stop'}]}),'{"stories":[]}')
    def test_reasoning_is_not_final_answer(self):
        with self.assertRaisesRegex(ValueError,'no final answer'):
            frontier.completion_text({'choices':[{'message':{'reasoning_content':'private reasoning'},'finish_reason':'stop'}]})
    def test_token_exhaustion(self):
        with self.assertRaisesRegex(ValueError,'token budget'):
            frontier.completion_text({'choices':[{'message':{},'finish_reason':'length'}]})
    def test_missing_choices(self):
        with self.assertRaisesRegex(ValueError,'no choices'):
            frontier.completion_text({'error':{'message':'do not print'}})

class CandidateSelection(unittest.TestCase):
    def test_every_candidate_reaches_model_in_bounded_batches(self):
        rows = [dict(source='lab', url=f'https://example.org/{i}', title=str(i),
                     text='Excerpt') for i in range(81)]
        batches = []

        def rank(_, batch):
            batches.append(batch)
            indices = sorted(range(len(batch)), key=lambda i: int(batch[i]['title']), reverse=True)
            return {'indices': indices[:20]}

        with patch.object(frontier, 'model_json', side_effect=rank):
            selected = frontier.ranked_candidates('science', rows, 20)
        self.assertEqual({row['title'] for batch in batches for row in batch}, {row['title'] for row in rows})
        self.assertTrue(all(len(batch) <= 40 for batch in batches))
        self.assertEqual([row['title'] for row in selected], [str(i) for i in range(80, 60, -1)])

    def test_duplicate_urls_are_merged(self):
        row = dict(source='lab', url='https://example.org/a')
        self.assertEqual(frontier.unique_candidates([row, row]), {row['url']: row})

class ReportingDates(unittest.TestCase):
    def test_invalid_and_extreme_dates_are_excluded(self):
        start=monday('2026-11-09'); end=start+dt.timedelta(days=7)
        for value in ['0001-01-01T00:00:00+00:00','invalid',None,'2026-11-10T00:00:00']:
            self.assertFalse(frontier.in_reporting_week(value,start,end))
        self.assertTrue(frontier.in_reporting_week('2026-11-10T00:00:00+00:00',start,end))

class Navigation(unittest.TestCase):
    def test_preserves_prose_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            for name in ['README.md','weekly/README.md','topics/ai/README.md']:
                page=root/name; page.parent.mkdir(parents=True,exist_ok=True)
                page.write_text('# Editorial introduction\n\n<!-- navigation:start -->\n<!-- navigation:end -->\n\nSource notes.\n')
            with patch.object(frontier,'ROOT',root):
                frontier.refresh_navigation()
                self.assertIn('No editions published yet.',(root/'README.md').read_text())
                edition=root/'weekly/2027/week-of-2026-12-28.md'
                edition.parent.mkdir(); edition.write_text('# Edition')
                frontier.refresh_navigation()
                before=(root/'README.md').read_text()
                frontier.refresh_navigation()
                self.assertEqual(before,(root/'README.md').read_text())
                self.assertIn('Editorial introduction',before)
                self.assertIn('Source notes.',before)
                self.assertIn('December 28, 2026–January 3, 2027',before)

class ReaderPresentation(unittest.TestCase):
    def test_weekly_page_excludes_diagnostics(self):
        text=frontier.weekly_page(monday('2026-11-09'),['- [AI](ai.md)'],['- A story'])
        self.assertIn('November 9–15, 2026',text)
        self.assertIn('## Topic briefings',text)
        self.assertNotIn('Collection reports',text)
        self.assertNotIn('```json',text)
    def test_publisher_and_dates_are_readable(self):
        self.assertEqual(frontier.publisher_name('bbc-tech'),'BBC Technology')
        self.assertEqual(frontier.publication_date('2026-11-14T02:00:00+00:00'),'November 13, 2026')
